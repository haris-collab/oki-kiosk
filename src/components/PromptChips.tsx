import React from 'react';

/**
 * Floating prompt-suggestion chips that drift around the avatar.
 * Their job: provoke the visitor into asking. They are NOT clickable
 * (this is a voice kiosk) — they're conversation seeds.
 */

interface Chip {
  text: string;
  top: string;
  left: string;
  right?: string;
  rotate: number;
  color: string;
  bg: string;
  anim: 1 | 2 | 3;
}

const CHIPS: Chip[] = [
  {
    text: 'Is there a new ParSEC in Whitefield?',
    top: '14%',
    left: '6%',
    rotate: -4,
    color: '#7c3aed',
    bg: 'rgba(139, 92, 246, 0.10)',
    anim: 1,
  },
  {
    text: 'What is the Vimana Gallery?',
    top: '20%',
    left: '74%',
    rotate: 3,
    color: '#0d9488',
    bg: 'rgba(20, 184, 166, 0.12)',
    anim: 2,
  },
  {
    text: 'Tell me about Maker’s Adda',
    top: '54%',
    left: '4%',
    rotate: 2,
    color: '#c2410c',
    bg: 'rgba(255, 107, 61, 0.12)',
    anim: 3,
  },
  {
    text: 'Why do octopuses have nine brains?',
    top: '46%',
    left: '78%',
    rotate: -3,
    color: '#be185d',
    bg: 'rgba(236, 72, 153, 0.10)',
    anim: 1,
  },
  {
    text: 'When are weekday lunch timings?',
    top: '70%',
    left: '14%',
    rotate: -2,
    color: '#a16207',
    bg: 'rgba(245, 176, 65, 0.16)',
    anim: 2,
  },
  {
    text: 'Who are the Zinions?',
    top: '74%',
    left: '70%',
    rotate: 4,
    color: '#7c3aed',
    bg: 'rgba(139, 92, 246, 0.10)',
    anim: 3,
  },
];

const PromptChips: React.FC<{ visible: boolean }> = ({ visible }) => {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transition: 'opacity 400ms ease',
      }}
    >
      {CHIPS.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            background: c.bg,
            color: c.color,
            border: `1.5px dashed ${c.color}`,
            padding: '10px 14px',
            borderRadius: 'var(--radius-chip)',
            fontSize: 13,
            fontWeight: 500,
            maxWidth: 220,
            lineHeight: 1.35,
            backdropFilter: 'blur(4px)',
            transform: `rotate(${c.rotate}deg)`,
            animation: `chip-float-${c.anim} ${6 + i}s ease-in-out infinite`,
            boxShadow: '0 4px 12px rgba(17, 32, 60, 0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>“</span>
          <span>{c.text}</span>
        </div>
      ))}
    </div>
  );
};

export default PromptChips;
