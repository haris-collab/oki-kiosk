import React from 'react';
import OkiOctopus from './OkiOctopus';

/**
 * Full-screen intro splash. Tapping it counts as the user gesture
 * we need to (a) unlock AudioContext, (b) request mic permission,
 * (c) open the Gemini WebSocket. Without this, Chrome blocks audio
 * and the kiosk gets stuck on "Connecting..." forever.
 */
interface Props {
  onBegin: () => void;
}

const Splash: React.FC<Props> = ({ onBegin }) => {
  return (
    <button
      onClick={onBegin}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 32,
        cursor: 'pointer',
        background:
          'radial-gradient(900px 700px at 30% 30%, rgba(245,176,65,0.18), transparent 60%),' +
          'radial-gradient(900px 700px at 70% 70%, rgba(139,92,246,0.20), transparent 60%),' +
          'var(--bg-cream)',
      }}
      aria-label="Tap to wake Oki"
    >
      {/* Octopus mark */}
      <div
        style={{
          width: 'clamp(180px, 26vw, 280px)',
          height: 'clamp(180px, 26vw, 280px)',
          animation: 'splash-bob 3.6s ease-in-out infinite',
          filter: 'drop-shadow(0 12px 24px rgba(17,32,60,0.18))',
        }}
      >
        <OkiOctopus animate withSparkles />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 580 }}>
        <h1
          className="display"
          style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            lineHeight: 1.05,
            color: 'var(--ink-900)',
            marginBottom: 12,
          }}
        >
          Hi! I&rsquo;m{' '}
          <span style={{ color: 'var(--thread-coral)' }}>Oki</span>.
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 1.3vw, 19px)',
            color: 'var(--ink-500)',
            lineHeight: 1.55,
          }}
        >
          Your octopus guide at <strong style={{ color: 'var(--ink-700)' }}>ParSEC Jayanagar</strong>.
          Tap anywhere to dive into the ocean of knowledge with me.
        </p>
      </div>

      {/* Tap-here pill */}
      <div
        style={{
          marginTop: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 24px',
          borderRadius: 999,
          background: 'var(--thread-coral)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          boxShadow:
            '0 0 0 6px rgba(255,107,61,0.18), 0 14px 40px rgba(255,107,61,0.45)',
          animation: 'oki-pulse-soft 2.4s ease-in-out infinite',
        }}
      >
        Tap to wake Oki
        <span style={{ fontSize: 18 }}>→</span>
      </div>

      <p
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--ink-300)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        You&rsquo;ll be asked for microphone access · this is a voice kiosk
      </p>

      <style>{`
        @keyframes oki-pulse-soft {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.04); }
        }
      `}</style>
    </button>
  );
};

export default Splash;
