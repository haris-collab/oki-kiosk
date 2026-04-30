# Oki Kiosk — ParSEC Whitefield

A voice-only kiosk for **Oki the Octopus**, the resident voice guide of the **Param Science Experience Centre, Whitefield** (Param Foundation).

Built with **Vite + React + TypeScript**, powered by the **Gemini Live API** (`gemini-2.5-flash-native-audio-preview-09-2025`), with **Supabase** logging and a **push-to-talk** kiosk UX.

---

## Features

- **Hold-to-talk** — visitor presses and holds; on release, Oki replies. No accidental activations.
- **Native audio model** — Gemini does ASR + TTS in one round trip. Low latency.
- **Indian English voice** — voice "Kore" + system prompt instructing warm Indian English delivery.
- **Grounded knowledge** — full ParSEC Whitefield knowledge base baked into the system prompt. No file upload, no RAG plumbing to maintain.
- **Conversation logging** — every turn (user question + Oki's answer) written to Supabase. Fail-soft: if keys are missing or the network drops, the kiosk keeps working.
- **Robust** — auto-reconnect on socket failure, race-condition-safe session management, window-level pointer release so the button never gets stuck.
- **Param theme** — deep ocean palette, Fraunces + Inter fonts, accent stars in Param's purple/yellow/pink.

---

## Quick start

```bash
cd oki-kiosk
cp .env.example .env
# fill in GEMINI_API_KEY (required)
# optionally fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

Open `http://localhost:5173`. Grant microphone permission. Hold the orange button to talk.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | Gemini API key. Used by the browser (Vite injects it at build time). |
| `VITE_SUPABASE_URL` | No | Supabase project URL. Leave blank to disable logging. |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key. Leave blank to disable logging. |

Note: any value injected at build time is visible in the bundle. Use a Gemini key with appropriate domain restrictions when deploying publicly.

---

## Supabase setup

Run this once in the Supabase SQL editor:

```sql
create table if not exists oki_conversations (
  id            bigserial primary key,
  session_id    text       not null,
  user_question text,
  oki_answer    text,
  created_at    timestamptz not null default now()
);

-- Allow inserts from the browser anon key
alter table oki_conversations enable row level security;

create policy "anon_insert_oki_conversations"
  on oki_conversations
  for insert
  to anon
  with check (true);
```

That's it. Each visitor turn writes one row.

To group turns by visitor session, query by `session_id` — the kiosk creates a new id every time the "New visitor" button is pressed (or the page is reloaded).

---

## Project layout

```
oki-kiosk/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── Avatar.tsx
    │   ├── PushToTalkButton.tsx
    │   ├── StatusBar.tsx
    │   └── TranscriptRibbon.tsx
    ├── constants/
    │   └── oki-prompt.ts        ← Oki persona + ParSEC knowledge
    ├── hooks/
    │   └── useLiveSession.ts    ← Gemini Live + push-to-talk
    └── lib/
        ├── audio.ts             ← PCM <-> base64 helpers
        └── supabase.ts          ← fail-soft conversation logger
```

---

## How push-to-talk works (behind the scenes)

1. On mount, the app opens a single Gemini Live WebSocket session and grabs the mic. The session stays open across PTT releases so Oki remembers the conversation.
2. The Live session is configured with `realtimeInputConfig.automaticActivityDetection: { disabled: true }` so the server does **not** auto-detect the end of speech — we drive turns explicitly.
3. **On press** (mouse / touch / space / enter):
   - Any audio Oki is currently playing is interrupted.
   - We send `{ activityStart: {} }`.
   - Mic frames flow to the server until release.
4. **On release**:
   - We send `{ activityEnd: {} }`. The model treats that as the end of the user's turn and starts responding.
5. Server messages stream in: input transcript, output transcript, output audio (24 kHz PCM). On `turnComplete`, the user/Oki transcripts for that turn are written to Supabase.

Pointer-up listeners are attached at the **window** level so a finger drifting off the button still releases cleanly. This was a kiosk-reliability hardening over the prototype.

---

## Deploying to Netlify

The build is a static SPA — Netlify works out of the box.

1. Push this folder to a Git repo.
2. In Netlify: **Add new site → Import from Git** and pick the repo.
3. **Base directory:** `oki-kiosk` (if the repo has the project nested).
4. **Build command:** `npm run build`
5. **Publish directory:** `oki-kiosk/dist` (or just `dist` if base directory is set).
6. **Environment variables:** add `GEMINI_API_KEY`, optionally `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
7. Deploy.

> **HTTPS is required** for `getUserMedia` (microphone). Netlify gives you HTTPS automatically.

---

## Hardening notes for kiosk deployment

- **Browser:** run in fullscreen kiosk mode on Chrome / Edge. The mic permission is sticky once granted.
- **Mic access:** launch Chrome with `--use-fake-ui-for-media-stream` is **not** recommended in production; instead, grant the site mic access once via the browser settings. Chrome remembers it.
- **Idle reset:** add a hardware "New visitor" button or a wall-mounted reset workflow. The reset clears server-side conversation memory and rotates the `session_id` for analytics.
- **Audio output:** wire the kiosk's speaker into the default audio device. The browser will play through whatever is system-default.
- **Network drop:** the hook auto-reconnects up to 5 times with exponential backoff. After that the UI shows an error banner so staff can intervene.

---

## Things deliberately kept out of scope

- File upload + RAG retriever (replaced by baked-in knowledge in `src/constants/oki-prompt.ts`).
- Feedback thumbs (the user's data shows feedback is rarely tapped on kiosks; can be added later).
- Multi-language UI (Oki herself can speak many languages thanks to the model; the visible UI is English-only for now).

---

## Updating Oki's knowledge

When ParSEC adds a gallery or changes hours, update the `PARAM_KNOWLEDGE` constant in `src/constants/oki-prompt.ts` and redeploy. No retraining needed.
