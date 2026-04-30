import React from 'react';
import type { LiveStatus } from '../hooks/useLiveSession';
import OkiOctopus from './OkiOctopus';

interface Props {
  status: LiveStatus;
  isMicOn: boolean;
  micLevel: number;
  outputLevel: number;
}

/**
 * Oki avatar — octopus inside a glowing orb. Cream-theme version
 * with soft pastel glows. Listening uses mic level, speaking uses
 * Oki's voice level.
 */
const Avatar: React.FC<Props> = ({ status, isMicOn, micLevel, outputLevel }) => {
  const isSpeaking = status === 'speaking' && outputLevel > 0.04;
  const isListening = isMicOn;
  const isThinking = status === 'thinking';

  const breathe = isSpeaking ? outputLevel : isListening ? micLevel : 0;
  const scale = 1 + breathe * 0.12;

  const ringColor =
    isSpeaking ? 'rgba(255, 107, 61, 0.55)' :
    isListening ? 'rgba(139, 92, 246, 0.55)' :
    isThinking ? 'rgba(245, 176, 65, 0.55)' :
    'rgba(20, 184, 166, 0.45)';

  const orbGlow =
    isSpeaking ? '0 0 80px rgba(255,107,61,0.45), inset 0 0 40px rgba(255,107,61,0.18)' :
    isListening ? '0 0 80px rgba(139,92,246,0.45), inset 0 0 40px rgba(139,92,246,0.18)' :
    '0 0 60px rgba(20,184,166,0.35), inset 0 0 36px rgba(20,184,166,0.18)';

  return (
    <div
      style={{
        position: 'relative',
        width: 'clamp(200px, 30vw, 320px)',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {(isSpeaking || isListening || isThinking) && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${ringColor}`,
              animation: 'oki-pulse 1.8s ease-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${ringColor}`,
              animation: 'oki-pulse 1.8s ease-out 0.6s infinite',
            }}
          />
        </>
      )}

      <div
        style={{
          width: '88%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(20,184,166,0.18) 55%, rgba(139,92,246,0.18) 100%)',
          border: '1px solid rgba(17,32,60,0.06)',
          boxShadow: orbGlow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          transition: 'transform 80ms ease-out, box-shadow 200ms ease',
          animation:
            !isSpeaking && !isListening && !isThinking
              ? 'oki-bob 4.5s ease-in-out infinite'
              : undefined,
        }}
      >
        <div style={{ width: '78%', height: '78%' }}>
          <OkiOctopus
            animate
            withSparkles
            mood={
              isSpeaking ? 'happy' :
              isListening ? 'curious' :
              isThinking ? 'calm' :
              'winking'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Avatar;
