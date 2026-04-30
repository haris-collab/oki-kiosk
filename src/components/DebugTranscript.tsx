import React, { useState } from 'react';

/**
 * Tiny dev-only transcript readout pinned to the bottom-left corner.
 * Stays out of the way visually; only useful while building. Can be
 * collapsed to a single dot. In production you can pass `hide` true
 * or remove this component entirely.
 */
interface Props {
  userText: string;
  okiText: string;
  hide?: boolean;
}

// Same heuristic used by the Supabase logger — if the transcript is
// mostly digits / non-letters / very short, we surface "(unclear)" in
// the dev panel instead of misleading nonsense like "2u8 200556".
function isUnclearTranscript(raw: string): boolean {
  const text = raw.trim();
  if (text.length < 3) return true;
  const compact = text.replace(/\s+/g, '');
  if (compact.length === 0) return true;
  const letters = (compact.match(/[a-zA-Z]/g) || []).length;
  if (letters / compact.length < 0.5) return true;
  if (!/[a-zA-Z]{3,}/.test(text)) return true;
  return false;
}

const DebugTranscript: React.FC<Props> = ({ userText, okiText, hide }) => {
  const [open, setOpen] = useState(true);
  if (hide) return null;
  if (!userText && !okiText) return null;

  const userDisplay =
    userText && isUnclearTranscript(userText) ? '(unclear audio)' : userText;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 50,
        maxWidth: 360,
        fontSize: 11,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        color: 'var(--ink-500)',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(17,32,60,0.08)',
        borderRadius: 10,
        padding: open ? '8px 10px' : '4px 8px',
        boxShadow: '0 4px 12px rgba(17,32,60,0.06)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setOpen((v) => !v)}
      title={open ? 'Click to collapse debug transcript' : 'Click to expand'}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 9,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-300)',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--thread-coral)',
          }}
        />
        debug · transcript
      </div>
      {open && (
        <div style={{ marginTop: 6, lineHeight: 1.45 }}>
          {userText && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--thread-coral)' }}>you:</span>{' '}
              <span
                style={{
                  color: userDisplay === userText ? 'var(--ink-700)' : 'var(--ink-300)',
                  fontStyle: userDisplay === userText ? 'normal' : 'italic',
                }}
              >
                {userDisplay}
              </span>
            </div>
          )}
          {okiText && (
            <div>
              <span style={{ color: 'var(--thread-teal)' }}>oki:</span>{' '}
              <span style={{ color: 'var(--ink-700)' }}>{okiText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugTranscript;
