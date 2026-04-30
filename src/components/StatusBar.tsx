import React from 'react';
import type { LiveStatus } from '../hooks/useLiveSession';
import OkiOctopus from './OkiOctopus';

interface Props {
  status: LiveStatus;
  onReset: () => void;
}

const STATUS_TEXT: Record<LiveStatus, { label: string; color: string }> = {
  'awaiting-tap': { label: 'Asleep',     color: '#5b6e8e' },
  connecting:     { label: 'Waking…',    color: '#a16207' },
  ready:          { label: 'Ready',      color: '#0d9488' },
  listening:      { label: 'Listening',  color: '#7c3aed' },
  thinking:       { label: 'Thinking',   color: '#a16207' },
  speaking:       { label: 'Speaking',   color: '#0d9488' },
  error:          { label: 'Error',      color: '#dc2626' },
};

const StatusBar: React.FC<Props> = ({ status, onReset }) => {
  const s = STATUS_TEXT[status];
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        gap: 16,
        zIndex: 10,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, #ffffff, rgba(20,184,166,0.20) 70%)',
            border: '1px solid rgba(17,32,60,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            boxShadow: '0 6px 18px rgba(20,184,166,0.18)',
          }}
        >
          <OkiOctopus size="100%" animate={false} />
        </div>
        <div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--ink-900)' }}>
            Oki
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-500)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            ParSEC Jayanagar · Param Foundation
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(17,32,60,0.08)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: s.color,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: s.color,
              boxShadow: `0 0 10px ${s.color}`,
              animation:
                status === 'listening' || status === 'speaking' || status === 'connecting'
                  ? 'oki-pulse 1.6s ease-out infinite'
                  : undefined,
            }}
          />
          {s.label}
        </div>

        <button
          onClick={onReset}
          disabled={status === 'awaiting-tap'}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid rgba(17,32,60,0.12)',
            background: 'rgba(255,255,255,0.6)',
            color: 'var(--ink-700)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
          aria-label="Reset session for next visitor"
        >
          New visitor
        </button>
      </div>
    </header>
  );
};

export default StatusBar;
