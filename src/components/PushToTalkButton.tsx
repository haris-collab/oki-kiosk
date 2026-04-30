import React, { useEffect, useRef } from 'react';
import type { LiveStatus } from '../hooks/useLiveSession';

interface Props {
  status: LiveStatus;
  isMicOn: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

/**
 * Press-and-hold button.
 *
 * • setPointerCapture() on pointerdown so subsequent events fire on this
 *   element regardless of where the finger drifts.
 * • Phantom-release filter: pointerup events that fire <100 ms after
 *   pointerdown are ignored. macOS trackpads (and some other hardware)
 *   sometimes synthesise an immediate pointerup as part of the click
 *   gesture itself; humans don't release that fast. If a phantom up is
 *   ignored, the mic stays on and either server VAD or the 30 s safety
 *   timer will close it cleanly.
 * • Listeners are on the BUTTON, not on window — window-level handlers
 *   were the previous bug (mic-recording indicator focus events triggered
 *   blur and faked a release).
 */
const PushToTalkButton: React.FC<Props> = ({
  status,
  isMicOn,
  onStart,
  onStop,
  disabled,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isHoldingRef = useRef(false);
  const pressStartedAtRef = useRef<number>(0);

  // Strict hold-to-talk: hold = mic on, release = mic off.
  const press = () => {
    if (isHoldingRef.current) return;
    isHoldingRef.current = true;
    pressStartedAtRef.current = Date.now();
    onStart();
  };

  const release = () => {
    if (!isHoldingRef.current) return;
    isHoldingRef.current = false;
    onStop();
  };

  // Keyboard: Space / Enter while button has focus.
  useEffect(() => {
    const isOurFocus = () => document.activeElement === buttonRef.current;
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!isOurFocus()) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        press();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (!isOurFocus()) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cta = isMicOn
    ? 'Listening — release when done'
    : status === 'thinking'
      ? 'Oki is thinking…'
      : status === 'speaking'
        ? 'Oki is speaking — hold to interrupt'
        : status === 'connecting'
          ? 'Waking Oki…'
          : status === 'error'
            ? 'Connection error'
            : 'Press and HOLD to talk';

  const isDisabled =
    disabled ||
    status === 'connecting' ||
    status === 'awaiting-tap' ||
    status === 'error';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <button
        ref={buttonRef}
        disabled={isDisabled}
        onPointerDown={(e) => {
          if (isDisabled) return;
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          e.preventDefault();
          try {
            (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
          } catch {
            /* older Safari / no pointer capture support */
          }
          press();
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          release();
          try {
            (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
          } catch {
            /* noop */
          }
        }}
        onPointerCancel={() => release()}
        onLostPointerCapture={() => release()}
        onContextMenu={(e) => e.preventDefault()}
        aria-pressed={isMicOn}
        aria-label={cta}
        style={{
          position: 'relative',
          width: 'clamp(140px, 16vw, 180px)',
          height: 'clamp(140px, 16vw, 180px)',
          borderRadius: '50%',
          background: isMicOn
            ? 'radial-gradient(circle at 30% 30%, #c084fc, #7c3aed 70%)'
            : 'radial-gradient(circle at 30% 30%, #ff8a65, #ff6b3d 70%)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 'clamp(13px, 1.2vw, 15px)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow: isMicOn
            ? '0 0 0 8px rgba(124,58,237,0.18), 0 0 70px 10px rgba(124,58,237,0.5), inset 0 -8px 18px rgba(0,0,0,0.18)'
            : '0 0 0 6px rgba(255,107,61,0.16), 0 0 40px 4px rgba(255,107,61,0.35), inset 0 -8px 18px rgba(0,0,0,0.16)',
          transform: isMicOn ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 100ms ease, box-shadow 200ms ease, background 200ms ease',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        <span style={{ display: 'block', lineHeight: 1.1, pointerEvents: 'none' }}>
          {isMicOn ? 'LISTENING' : 'HOLD'}
        </span>
        <span
          style={{
            display: 'block',
            fontSize: '0.78em',
            opacity: 0.9,
            marginTop: 4,
            pointerEvents: 'none',
          }}
        >
          {isMicOn ? 'release when done' : 'to talk'}
        </span>
      </button>

      <p
        style={{
          color: 'var(--ink-500)',
          fontSize: 'clamp(13px, 1.05vw, 14px)',
          maxWidth: 420,
          textAlign: 'center',
          minHeight: '1.4em',
        }}
      >
        {cta}
      </p>
    </div>
  );
};

export default PushToTalkButton;
