import React from 'react';

/**
 * Wavy "thread" SVG background — the squiggly motif Param uses
 * across paramfoundation.org. Multiple threads in different
 * accent colours, slowly flowing.
 *
 * stroke-dasharray + animated stroke-dashoffset gives the
 * sense of the threads being drawn / flowing.
 */
const ThreadBackground: React.FC = () => {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.55,
      }}
    >
      {/* Top-left teal squiggle */}
      <path
        d="M -50 140 Q 120 60, 240 160 T 480 140 T 720 200 T 960 120 T 1200 180 T 1500 100"
        fill="none"
        stroke="var(--thread-teal)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 14"
        style={{ animation: 'thread-flow 18s linear infinite' }}
      />

      {/* Mid purple ribbon */}
      <path
        d="M -50 420 C 200 320, 380 520, 600 420 S 1000 340, 1200 460 S 1500 420, 1500 420"
        fill="none"
        stroke="var(--thread-purple)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2 12"
        style={{ animation: 'thread-flow 22s linear infinite' }}
      />

      {/* Lower coral wave */}
      <path
        d="M -50 700 Q 200 620, 400 720 T 800 700 T 1200 760 T 1500 680"
        fill="none"
        stroke="var(--thread-coral)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="8 10"
        style={{ animation: 'thread-flow 25s linear infinite reverse' }}
      />

      {/* Pink loose strand */}
      <path
        d="M 1100 -20 Q 1180 80, 1080 180 T 1260 320 T 1140 480 T 1280 640 T 1100 820"
        fill="none"
        stroke="var(--thread-pink)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 10"
        style={{ animation: 'thread-flow 20s linear infinite' }}
      />

      {/* Yellow light strand top right */}
      <path
        d="M 800 60 Q 920 20, 1020 100 T 1280 80 T 1460 160"
        fill="none"
        stroke="var(--thread-yellow)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="2 9"
        style={{ animation: 'thread-flow 16s linear infinite reverse' }}
      />

      {/* Stars / dots scattered */}
      <Star cx={120} cy={620} color="var(--thread-yellow)" />
      <Star cx={1300} cy={140} color="var(--thread-purple)" size={14} />
      <Star cx={260} cy={780} color="var(--thread-pink)" size={10} />
      <Star cx={1180} cy={760} color="var(--thread-yellow)" size={16} />
      <Star cx={920} cy={820} color="var(--thread-teal)" size={9} />
      <Star cx={420} cy={120} color="var(--thread-pink)" size={11} />
      <Star cx={1040} cy={300} color="var(--thread-yellow)" size={12} />

      {/* Hand-drawn spring (curly arrow) bottom-left */}
      <path
        d="M 200 760 c 12 -18, 30 -18, 30 0 s -18 18, -18 0 s 30 -18, 30 0 s -18 18, -18 0 s 30 -18, 30 0"
        fill="none"
        stroke="var(--thread-coral)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Hand-drawn spring top-right */}
      <path
        d="M 1240 220 c 12 -18, 30 -18, 30 0 s -18 18, -18 0 s 30 -18, 30 0 s -18 18, -18 0"
        fill="none"
        stroke="var(--thread-purple)"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
};

const Star: React.FC<{ cx: number; cy: number; color: string; size?: number }> = ({
  cx,
  cy,
  color,
  size = 12,
}) => (
  <g transform={`translate(${cx} ${cy})`} opacity={0.85}>
    <path
      d={`M 0 -${size} L ${size * 0.3} -${size * 0.3} L ${size} 0 L ${size * 0.3} ${size * 0.3} L 0 ${size} L -${size * 0.3} ${size * 0.3} L -${size} 0 L -${size * 0.3} -${size * 0.3} Z`}
      fill={color}
    />
  </g>
);

export default ThreadBackground;
