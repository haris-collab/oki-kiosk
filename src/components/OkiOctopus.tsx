import React from 'react';

interface Props {
  size?: number | string;
  /** Tiny tentacle wave + bubble drift. Disable for the small header. */
  animate?: boolean;
  /** Surrounding sparkles + bubbles around her. */
  withSparkles?: boolean;
  /** "winking" (default), "happy", "curious", or "calm". */
  mood?: 'winking' | 'happy' | 'curious' | 'calm';
}

/**
 * Oki — kawaii octopus mascot, Param coral palette.
 *
 * Style cues taken from Param's mascot illustrations: solid body,
 * minimal outlines, simple kawaii face, friendly tentacles with
 * visible sucker dots. No system emoji; pure SVG so it scales
 * cleanly from 36 px to 400 px.
 */
const OkiOctopus: React.FC<Props> = ({
  size = '100%',
  animate = true,
  withSparkles = false,
  mood = 'winking',
}) => {
  // Brand palette — Param coral
  const BODY = '#ff7a4d';
  const BODY_DARK = '#e85a2f';
  const BODY_LIGHT = '#ffb59a';
  const SUCKER = '#ffd9c4';
  const INK = '#1a2e4f';
  const BLUSH = '#ec4899';

  return (
    <svg
      viewBox="0 0 220 240"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', display: 'block' }}
      aria-hidden
    >
      <defs>
        <filter id="oki-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor="#11203c"
            floodOpacity="0.18"
          />
        </filter>
      </defs>

      <g filter="url(#oki-shadow)">
        {/* ============ Tentacles (drawn under body) ============ */}

        {/* Far-left tentacle — curls outward */}
        <g
          style={
            animate
              ? {
                  transformOrigin: '76px 132px',
                  animation: 'oki-tent-a 4.5s ease-in-out infinite',
                }
              : undefined
          }
        >
          <path
            d="M 76 130
               C 36 144, 24 198, 50 208
               C 74 214, 84 192, 82 172
               C 84 158, 90 152, 96 148 Z"
            fill={BODY}
          />
          {/* Underside lighter strip */}
          <path
            d="M 50 200 C 56 210, 72 212, 80 198 C 84 184, 80 174, 84 164"
            fill="none"
            stroke={BODY_LIGHT}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Suckers */}
          <circle cx="56" cy="194" r="2.6" fill={SUCKER} />
          <circle cx="64" cy="202" r="2.4" fill={SUCKER} />
          <circle cx="72" cy="202" r="2.6" fill={SUCKER} />
          <circle cx="78" cy="190" r="2.4" fill={SUCKER} />
          <circle cx="80" cy="178" r="2.2" fill={SUCKER} />
        </g>

        {/* Mid-left tentacle — drooping */}
        <g
          style={
            animate
              ? {
                  transformOrigin: '100px 144px',
                  animation: 'oki-tent-b 4.5s ease-in-out 0.4s infinite',
                }
              : undefined
          }
        >
          <path
            d="M 96 140
               C 78 174, 86 218, 104 220
               C 122 218, 118 196, 112 180
               C 110 168, 110 158, 110 152 Z"
            fill={BODY}
          />
          <path
            d="M 86 200 C 92 218, 116 218, 118 200 C 116 188, 114 178, 112 168"
            fill="none"
            stroke={BODY_LIGHT}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="92" cy="200" r="2.4" fill={SUCKER} />
          <circle cx="100" cy="212" r="2.6" fill={SUCKER} />
          <circle cx="110" cy="212" r="2.4" fill={SUCKER} />
          <circle cx="116" cy="200" r="2.6" fill={SUCKER} />
          <circle cx="115" cy="186" r="2.2" fill={SUCKER} />
        </g>

        {/* Mid-right tentacle — drooping (mirror of mid-left) */}
        <g
          style={
            animate
              ? {
                  transformOrigin: '120px 144px',
                  animation: 'oki-tent-b 4.5s ease-in-out 0.9s infinite reverse',
                }
              : undefined
          }
        >
          <path
            d="M 124 140
               C 142 174, 134 218, 116 220
               C 98 218, 102 196, 108 180
               C 110 168, 110 158, 110 152 Z"
            fill={BODY}
          />
          <path
            d="M 134 200 C 128 218, 104 218, 102 200 C 104 188, 106 178, 108 168"
            fill="none"
            stroke={BODY_LIGHT}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="128" cy="200" r="2.4" fill={SUCKER} />
          <circle cx="120" cy="212" r="2.6" fill={SUCKER} />
          <circle cx="110" cy="212" r="2.4" fill={SUCKER} />
          <circle cx="104" cy="200" r="2.6" fill={SUCKER} />
          <circle cx="105" cy="186" r="2.2" fill={SUCKER} />
        </g>

        {/* Far-right tentacle — curls outward (mirror of far-left) */}
        <g
          style={
            animate
              ? {
                  transformOrigin: '144px 132px',
                  animation: 'oki-tent-a 4.5s ease-in-out 1.4s infinite reverse',
                }
              : undefined
          }
        >
          <path
            d="M 144 130
               C 184 144, 196 198, 170 208
               C 146 214, 136 192, 138 172
               C 136 158, 130 152, 124 148 Z"
            fill={BODY}
          />
          <path
            d="M 170 200 C 164 210, 148 212, 140 198 C 136 184, 140 174, 136 164"
            fill="none"
            stroke={BODY_LIGHT}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="164" cy="194" r="2.6" fill={SUCKER} />
          <circle cx="156" cy="202" r="2.4" fill={SUCKER} />
          <circle cx="148" cy="202" r="2.6" fill={SUCKER} />
          <circle cx="142" cy="190" r="2.4" fill={SUCKER} />
          <circle cx="140" cy="178" r="2.2" fill={SUCKER} />
        </g>

        {/* ============ Body ============ */}
        <ellipse cx="110" cy="100" rx="65" ry="58" fill={BODY} />

        {/* Subtle bottom shadow (gives volume) */}
        <ellipse
          cx="110"
          cy="148"
          rx="55"
          ry="14"
          fill={BODY_DARK}
          opacity="0.35"
        />

        {/* Top sheen */}
        <ellipse
          cx="86"
          cy="64"
          rx="22"
          ry="9"
          fill="#ffffff"
          opacity="0.5"
          transform="rotate(-22 86 64)"
        />
        <circle cx="76" cy="58" r="5" fill="#ffffff" opacity="0.65" />

        {/* ============ Face ============ */}
        <Face mood={mood} ink={INK} blush={BLUSH} />
      </g>

      {/* ============ Sparkles around her ============ */}
      {withSparkles && (
        <g>
          <circle
            cx="28"
            cy="58"
            r="5"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="1.6"
            opacity="0.55"
            style={
              animate
                ? { animation: 'oki-bubble 6s ease-in-out infinite' }
                : undefined
            }
          />
          <circle
            cx="200"
            cy="80"
            r="4"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.6"
            opacity="0.55"
            style={
              animate
                ? { animation: 'oki-bubble 7s ease-in-out 1.5s infinite' }
                : undefined
            }
          />
          <path
            d="M 200 30 l 3 -8 l 3 8 l 8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 z"
            fill="#f5b041"
            opacity="0.85"
            style={
              animate
                ? { animation: 'oki-bubble 8s ease-in-out 0.4s infinite' }
                : undefined
            }
          />
          <path
            d="M 18 192 l 2 -5 l 2 5 l 5 2 l -5 2 l -2 5 l -2 -5 l -5 -2 z"
            fill="#ec4899"
            opacity="0.7"
            style={
              animate
                ? { animation: 'oki-bubble 9s ease-in-out 1s infinite' }
                : undefined
            }
          />
        </g>
      )}
    </svg>
  );
};

// ============================================================
// Face — reusable mood expressions
// ============================================================
const Face: React.FC<{ mood: NonNullable<Props['mood']>; ink: string; blush: string }> = ({
  mood,
  ink,
  blush,
}) => {
  return (
    <g>
      {/* Eyes */}
      {mood === 'winking' && (
        <>
          {/* Left eye open */}
          <ellipse cx="90" cy="93" rx="5.5" ry="7" fill={ink} />
          <circle cx="92" cy="91" r="2" fill="#ffffff" />
          {/* Right eye closed (wink) */}
          <path
            d="M 122 95 Q 130 89 138 95"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {mood === 'happy' && (
        <>
          {/* Both eyes closed smiling */}
          <path
            d="M 80 95 Q 88 89 96 95"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 124 95 Q 132 89 140 95"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {mood === 'curious' && (
        <>
          <ellipse cx="88" cy="93" rx="6" ry="8" fill={ink} />
          <circle cx="90" cy="90" r="2.4" fill="#ffffff" />
          <ellipse cx="132" cy="93" rx="6" ry="8" fill={ink} />
          <circle cx="134" cy="90" r="2.4" fill="#ffffff" />
        </>
      )}
      {mood === 'calm' && (
        <>
          <path
            d="M 80 96 Q 88 92 96 96"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 124 96 Q 132 92 140 96"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Smile */}
      <path
        d="M 100 116 Q 110 124 120 116"
        stroke={ink}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Blush */}
      <ellipse cx="76" cy="112" rx="8" ry="4" fill={blush} opacity="0.42" />
      <ellipse cx="144" cy="112" rx="8" ry="4" fill={blush} opacity="0.42" />
    </g>
  );
};

export default OkiOctopus;
