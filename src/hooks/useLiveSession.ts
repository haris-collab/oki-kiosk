// ============================================================
// useLiveSession — Gemini Live API + push-to-talk for the kiosk
// ============================================================
// Lifecycle:
//   • Sits idle until start() is called (must be inside a user gesture).
//     This avoids Chrome's AudioContext autoplay block AND the React
//     strict-mode mount→unmount→mount race that otherwise leaves
//     the session half-set-up.
//   • Once started, opens a single Gemini Live session that stays
//     connected. Mic stream is acquired once and gated by isMicOnRef.
//   • Press:   stop Oki's playback (interrupt) → activityStart
//   • Release: activityEnd → wait for response.
//   • Transcripts logged to Supabase per-turn.
//   • One auto-reconnect on socket failure with backoff.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleGenAI,
  Modality,
  type LiveServerMessage,
  type Session,
} from '@google/genai';

import { OKI_SYSTEM_INSTRUCTION } from '../constants/oki-prompt';
import {
  base64ToBytes,
  float32ToBase64PCM,
  pcm16ToAudioBuffer,
  rms,
} from '../lib/audio';
import {
  logConversationTurn,
  newSessionId,
} from '../lib/supabase';

const MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';
const INPUT_SR = 16000;
const OUTPUT_SR = 24000;

export type LiveStatus =
  | 'awaiting-tap'   // initial — waiting for user to tap "begin"
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

export interface UseLiveSessionResult {
  status: LiveStatus;
  errorMessage: string;
  micLevel: number;
  outputLevel: number;
  lastUserText: string;
  lastOkiText: string;
  /** True while the mic is open and streaming to Gemini. */
  isMicOn: boolean;
  /** Call from a user-gesture handler (button click) to wake the kiosk. */
  start: () => void;
  /** Open the mic and begin streaming. Press-and-hold semantics. */
  startListening: () => void;
  /** Close the mic. Server VAD will also auto-close on natural pause. */
  stopListening: () => void;
  /** Reset conversation memory and reconnect (uses prior gesture grant). */
  resetSession: () => void;
}

export function useLiveSession(): UseLiveSessionResult {
  const [status, setStatus] = useState<LiveStatus>('awaiting-tap');
  const [errorMessage, setErrorMessage] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [lastUserText, setLastUserText] = useState('');
  const [lastOkiText, setLastOkiText] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);

  // Vite natively exposes any env var prefixed with VITE_ via
  // import.meta.env. No build-config hacks needed — works the same
  // locally, on Netlify, and on any other host.
  const apiKey = useMemo<string | undefined>(() => {
    return import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  }, []);

  // ----- Persistent refs -----
  const sessionRef = useRef<Session | null>(null);
  const sessionPromiseRef = useRef<Promise<Session> | null>(null);

  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const playbackSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlaybackTimeRef = useRef<number>(0);

  const isMicOnRef = useRef(false);
  const autoStopTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(newSessionId());

  const userTurnBufferRef = useRef('');
  const okiTurnBufferRef = useRef('');

  const reconnectAttemptsRef = useRef(0);
  const outputLevelTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);
  const micLevelNonZeroRef = useRef(false);

  // ============================================================
  // Audio playback
  // ============================================================
  const stopAllPlayback = useCallback(() => {
    playbackSourcesRef.current.forEach((s) => {
      try { s.stop(); } catch { /* already stopped */ }
    });
    playbackSourcesRef.current.clear();
    nextPlaybackTimeRef.current = 0;
  }, []);

  const enqueuePlayback = useCallback((pcmBytes: Uint8Array) => {
    const ctx = outputCtxRef.current;
    const gain = outputGainRef.current;
    if (!ctx || !gain || ctx.state === 'closed') return;

    const buffer = pcm16ToAudioBuffer(pcmBytes, ctx, OUTPUT_SR);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    const startAt = Math.max(nextPlaybackTimeRef.current, ctx.currentTime);
    source.start(startAt);
    nextPlaybackTimeRef.current = startAt + buffer.duration;

    playbackSourcesRef.current.add(source);
    source.addEventListener('ended', () => {
      playbackSourcesRef.current.delete(source);
    });
  }, []);

  // ============================================================
  // Audio graph (only ever created once per mount, after gesture)
  // ============================================================
  const setupAudioGraph = useCallback(async (): Promise<void> => {
    if (inputCtxRef.current && outputCtxRef.current) return;

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;

    const inputCtx = new Ctx({ sampleRate: INPUT_SR });
    const outputCtx = new Ctx({ sampleRate: OUTPUT_SR });
    if (inputCtx.state === 'suspended') await inputCtx.resume();
    if (outputCtx.state === 'suspended') await outputCtx.resume();

    const gain = outputCtx.createGain();
    const analyser = outputCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    gain.connect(analyser);
    analyser.connect(outputCtx.destination);

    outputCtxRef.current = outputCtx;
    outputGainRef.current = gain;
    outputAnalyserRef.current = analyser;

    if (outputLevelTimerRef.current == null) {
      outputLevelTimerRef.current = window.setInterval(() => {
        const a = outputAnalyserRef.current;
        if (!a) return;
        const data = new Uint8Array(a.frequencyBinCount);
        a.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        if (isMountedRef.current) setOutputLevel(Math.min(1, avg / 60));
      }, 60);
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStreamRef.current = stream;

    const source = inputCtx.createMediaStreamSource(stream);
    micSourceRef.current = source;

    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const frame = e.inputBuffer.getChannelData(0);

      if (isMicOnRef.current && isMountedRef.current) {
        setMicLevel(Math.min(1, rms(frame) * 5));
      } else if (micLevelNonZeroRef.current) {
        micLevelNonZeroRef.current = false;
        setMicLevel(0);
      }

      const session = sessionRef.current;
      if (!session || !isMicOnRef.current) return;

      const b64 = float32ToBase64PCM(frame);
      try {
        session.sendRealtimeInput({
          audio: { data: b64, mimeType: `audio/pcm;rate=${INPUT_SR}` },
        });
      } catch (err) {
        console.warn('[Oki] sendRealtimeInput failed:', err);
      }
    };

    source.connect(processor);
    processor.connect(inputCtx.destination);

    inputCtxRef.current = inputCtx;
  }, []);

  // ============================================================
  // Server message handler
  // ============================================================
  const handleServerMessage = useCallback(
    (msg: LiveServerMessage) => {
      try {
        const sc = msg.serverContent;

        if (sc?.inputTranscription?.text) {
          userTurnBufferRef.current += sc.inputTranscription.text;
        }
        if (sc?.outputTranscription?.text) {
          okiTurnBufferRef.current += sc.outputTranscription.text;
          if (isMountedRef.current) setStatus('speaking');
        }

        const parts = sc?.modelTurn?.parts;
        if (parts) {
          for (const part of parts) {
            const data = part.inlineData?.data;
            const mime = part.inlineData?.mimeType || '';
            if (data && mime.startsWith('audio/')) {
              enqueuePlayback(base64ToBytes(data));
              if (isMountedRef.current) {
                setStatus((s) => (s === 'speaking' ? s : 'speaking'));
              }
            }
          }
        }

        if (sc?.interrupted) stopAllPlayback();

        if (sc?.turnComplete) {
          const userText = userTurnBufferRef.current.trim();
          const okiText = okiTurnBufferRef.current.trim();
          userTurnBufferRef.current = '';
          okiTurnBufferRef.current = '';

          // STRICT hold-to-talk: do NOT auto-stop the mic on turnComplete.
          // Mic state belongs to the physical button only. If server VAD
          // ends a turn while the user is still holding, that's fine —
          // server replies, mic keeps streaming as the next turn's input.
          // The mic only ever closes via release() or the 30 s safety timer.

          if (isMountedRef.current) {
            if (userText) setLastUserText(userText);
            if (okiText) setLastOkiText(okiText);
            // If user is still holding, leave status as 'listening' so the
            // visual stays in sync with the button.
            setStatus(isMicOnRef.current ? 'listening' : 'thinking');
          }

          if (userText || okiText) {
            void logConversationTurn({
              sessionId: sessionIdRef.current,
              userQuestion: userText,
              okiAnswer: okiText,
            });
          }
        }
      } catch (err) {
        console.error('[Oki] handleServerMessage error:', err);
      }
    },
    [enqueuePlayback, stopAllPlayback]
  );

  // ============================================================
  // Connect
  // ============================================================
  const connect = useCallback(async () => {
    if (!apiKey) {
      setStatus('error');
      setErrorMessage(
        'Gemini API key is missing. Set GEMINI_API_KEY in .env and restart.'
      );
      return;
    }
    if (sessionRef.current || sessionPromiseRef.current) return;

    try {
      setStatus('connecting');
      setErrorMessage('');
      await setupAudioGraph();

      const ai = new GoogleGenAI({ apiKey });

      const promise = ai.live.connect({
        model: MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: OKI_SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            // NOTE: Do not add `languageCode` here — the native-audio
            // preview model rejects it and closes the WebSocket with
            // close code 1007 ("Unsupported language code 'en-IN' for
            // model gemini-2.5-flash-native-audio-preview-09-2025").
            // Indian-English accent is steered via the system prompt
            // at the top of OKI_SYSTEM_INSTRUCTION instead.
          },
          // VAD on with default behaviour — same as the version that was
          // working last night. Tuning was tempting but the Live API can
          // silently reject the connection when realtimeInputConfig has
          // unexpected shapes; defaults are the safe bet.
          // NOTE: Do NOT pass `languageCodes` here — the native-audio
          // preview model rejects it ("languageCodes parameter is not
          // supported in Gemini API"), exactly like it rejects
          // `languageCode` on speechConfig. Junk transcripts are
          // handled client-side by the looksLikeJunk() filter in
          // src/lib/supabase.ts before they reach the database.
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => { /* state set when promise resolves */ },
          onmessage: (m: LiveServerMessage) => handleServerMessage(m),
          onerror: (err: any) => {
            console.error('[Oki] Live API error:', err);
            if (!isMountedRef.current) return;
            setStatus('error');
            setErrorMessage(err?.message || err?.toString?.() || 'Connection error');
            scheduleReconnect();
          },
          onclose: () => {
            if (!isMountedRef.current) return;
            sessionRef.current = null;
            sessionPromiseRef.current = null;
            if (hasStartedRef.current && status !== 'awaiting-tap') {
              scheduleReconnect();
            }
          },
        },
      });

      sessionPromiseRef.current = promise;
      const session = await promise;

      if (!isMountedRef.current) {
        try { session.close(); } catch { /* noop */ }
        return;
      }

      sessionRef.current = session;
      reconnectAttemptsRef.current = 0;
      setStatus('ready');
    } catch (err: any) {
      console.error('[Oki] connect failed:', err);
      sessionPromiseRef.current = null;
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to connect');
      scheduleReconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, setupAudioGraph, handleServerMessage]);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current || !hasStartedRef.current) return;
    const attempt = ++reconnectAttemptsRef.current;
    if (attempt > 5) {
      setStatus('error');
      setErrorMessage(
        'Connection failed repeatedly. Tap "New visitor" or check the network.'
      );
      return;
    }
    const delay = Math.min(8000, 500 * Math.pow(2, attempt));
    window.setTimeout(() => {
      if (!isMountedRef.current || !hasStartedRef.current) return;
      connect();
    }, delay);
  }, [connect]);

  // ============================================================
  // Public controls
  // ============================================================
  const start = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    connect();
  }, [connect]);

  /** Internal: turn the mic OFF. Used by physical release and the
   *  30 s safety timer. */
  const stopMicInternal = useCallback((_reason: string) => {
    if (!isMicOnRef.current) return;
    isMicOnRef.current = false;
    setIsMicOn(false);
    setMicLevel(0);
    setStatus('thinking');

    // Explicitly mark end of the audio stream so the server commits the
    // buffered audio as a complete turn IMMEDIATELY, rather than waiting
    // for VAD's silence-detection threshold (~700 ms by default).
    // This kills the perceived lag when the user releases the button
    // quickly after their last word.
    const session = sessionRef.current;
    if (session) {
      try {
        session.sendRealtimeInput({ audioStreamEnd: true });
      } catch (err) {
        console.warn('[Oki] audioStreamEnd send failed:', err);
      }
    }

    if (autoStopTimerRef.current != null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  /** Open the mic — press-and-hold semantics. */
  const startListening = useCallback(() => {
    const session = sessionRef.current;
    if (!session) {
      // Connection not yet ready — quietly retry.
      if (hasStartedRef.current && !sessionPromiseRef.current) connect();
      return;
    }
    if (isMicOnRef.current) return;

    stopAllPlayback();          // interrupt Oki if she was speaking
    okiTurnBufferRef.current = '';
    isMicOnRef.current = true;
    micLevelNonZeroRef.current = true;
    setIsMicOn(true);
    setStatus('listening');

    // Safety: visitor walks away with mic on and never speaks → force stop.
    if (autoStopTimerRef.current != null) clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = window.setTimeout(() => {
      stopMicInternal('safety timeout (30s)');
    }, 30000);
  }, [connect, stopAllPlayback, stopMicInternal]);

  /** Close the mic — fired by button release. Server VAD also auto-closes. */
  const stopListening = useCallback(() => {
    stopMicInternal('manual release');
  }, [stopMicInternal]);

  const resetSession = useCallback(() => {
    isMicOnRef.current = false;
    setIsMicOn(false);
    if (autoStopTimerRef.current != null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    stopAllPlayback();
    userTurnBufferRef.current = '';
    okiTurnBufferRef.current = '';
    setLastUserText('');
    setLastOkiText('');
    setMicLevel(0);
    sessionIdRef.current = newSessionId();

    const s = sessionRef.current;
    sessionRef.current = null;
    sessionPromiseRef.current = null;
    if (s) {
      try { s.close(); } catch { /* noop */ }
    }
    reconnectAttemptsRef.current = 0;
    setStatus('connecting');
    window.setTimeout(() => {
      if (isMountedRef.current && hasStartedRef.current) connect();
    }, 200);
  }, [connect, stopAllPlayback]);

  // ============================================================
  // Mount/unmount — DO NOT auto-connect (waits for start())
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      if (outputLevelTimerRef.current != null) {
        clearInterval(outputLevelTimerRef.current);
        outputLevelTimerRef.current = null;
      }

      stopAllPlayback();

      try { sessionRef.current?.close(); } catch { /* noop */ }
      sessionRef.current = null;
      sessionPromiseRef.current = null;

      processorRef.current?.disconnect();
      micSourceRef.current?.disconnect();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      inputCtxRef.current?.close().catch(() => {});
      outputCtxRef.current?.close().catch(() => {});

      processorRef.current = null;
      micSourceRef.current = null;
      micStreamRef.current = null;
      inputCtxRef.current = null;
      outputCtxRef.current = null;
      outputGainRef.current = null;
      outputAnalyserRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    errorMessage,
    micLevel,
    outputLevel,
    lastUserText,
    lastOkiText,
    isMicOn,
    start,
    startListening,
    stopListening,
    resetSession,
  };
}
