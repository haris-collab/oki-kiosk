// ============================================================
// Audio helpers — PCM <-> base64 + buffer construction
// ============================================================
// Gemini Live expects 16 kHz PCM16 little-endian audio in.
// It returns 24 kHz PCM16 little-endian audio out.
// We use AudioContext sample rates (16000 in, 24000 out) to keep
// the math trivial and avoid resampling artifacts.
// ============================================================

/** Encode raw bytes as base64 (browser-safe, chunked). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk))
    );
  }
  return btoa(binary);
}

/** Decode base64 to bytes. */
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Convert Float32 PCM (range -1..1) to little-endian 16-bit PCM bytes. */
export function float32ToPCM16(input: Float32Array): Uint8Array {
  const out = new Uint8Array(input.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < input.length; i++) {
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, s, true);
  }
  return out;
}

/** Convenience: float32 frame -> base64-encoded 16-bit PCM. */
export function float32ToBase64PCM(input: Float32Array): string {
  return bytesToBase64(float32ToPCM16(input));
}

/**
 * Decode 16-bit little-endian PCM bytes into an AudioBuffer at the given
 * sample rate. We bypass the normal decodeAudioData path because the
 * bytes are raw PCM, not a container format.
 */
export function pcm16ToAudioBuffer(
  pcm: Uint8Array,
  ctx: AudioContext,
  sampleRate: number
): AudioBuffer {
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const sampleCount = pcm.byteLength / 2;
  const buffer = ctx.createBuffer(1, sampleCount, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    const v = view.getInt16(i * 2, true);
    channel[i] = v < 0 ? v / 0x8000 : v / 0x7fff;
  }
  return buffer;
}

/** RMS of a float32 frame, useful for visualizer levels. */
export function rms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}
