// ============================================================
// Supabase logging — fail-soft conversation logger
// ============================================================
// Each visitor turn (user question + Oki's answer) is appended
// to the `oki_conversations` table. If Supabase env vars are
// missing or the network fails, logging silently no-ops so the
// kiosk never breaks.
//
// SQL schema (run once in Supabase SQL editor):
//
//   create table if not exists oki_conversations (
//     id          bigserial primary key,
//     session_id  text       not null,
//     user_question text,
//     oki_answer    text,
//     created_at  timestamptz not null default now()
//   );
//
//   -- Allow inserts from the anon key (browser):
//   alter table oki_conversations enable row level security;
//   create policy "anon_insert_oki_conversations"
//     on oki_conversations
//     for insert
//     to anon
//     with check (true);
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/**
 * supabase-js appends `/rest/v1/<table>` itself. If the user pastes a URL
 * that already has a path (e.g. `…supabase.co/rest/v1`), requests double up
 * and 404. Normalize to scheme + host only.
 */
function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const u = new URL(trimmed);
    return `${u.protocol}//${u.host}`;
  } catch {
    // Not a valid URL — strip trailing slashes and hope for the best.
    return trimmed.replace(/\/+$/, '');
  }
}

const SUPABASE_URL = normalizeSupabaseUrl(RAW_SUPABASE_URL);

if (
  RAW_SUPABASE_URL &&
  SUPABASE_URL &&
  RAW_SUPABASE_URL.replace(/\/+$/, '') !== SUPABASE_URL
) {
  console.warn(
    `[Oki] VITE_SUPABASE_URL had extra path; using "${SUPABASE_URL}" instead of "${RAW_SUPABASE_URL}".`
  );
}

let client: SupabaseClient | null = null;
let warned = false;

function getClient(): SupabaseClient | null {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!warned) {
      console.info(
        '[Oki] Supabase env vars not set — conversation logging is disabled.'
      );
      warned = true;
    }
    return null;
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  return client;
}

export interface ConversationTurn {
  sessionId: string;
  userQuestion: string;
  okiAnswer: string;
}

/**
 * The native-audio preview model's input transcription is best-effort —
 * on quiet/noisy audio it sometimes returns garbage strings like
 * "2u8 200556", random punctuation, or fragments of other languages.
 * This heuristic flags strings that are very unlikely to be real
 * spoken English so we can store NULL instead of polluting Supabase.
 */
function looksLikeJunk(raw: string): boolean {
  const text = raw.trim();
  if (text.length < 3) return true;
  // Strip whitespace for ratio analysis.
  const compact = text.replace(/\s+/g, '');
  if (compact.length === 0) return true;
  const letters = (compact.match(/[a-zA-Z]/g) || []).length;
  // If under 50% of non-space characters are Latin letters, it's almost
  // certainly noise — real English speech has way more letters than that.
  if (letters / compact.length < 0.5) return true;
  // Reject if there's no recognisable word at all (no run of 3+ letters).
  if (!/[a-zA-Z]{3,}/.test(text)) return true;
  return false;
}

/**
 * Log a single user-question + Oki-answer pair.
 * Always resolves; never throws.
 */
export async function logConversationTurn(
  turn: ConversationTurn
): Promise<void> {
  const c = getClient();
  if (!c) return;

  const trimmedUser = turn.userQuestion.trim();
  const trimmedOki = turn.okiAnswer.trim();
  if (!trimmedUser && !trimmedOki) return;

  // Filter junk transcripts. Oki's reply is generated text and is always
  // clean; only the user transcription needs guarding.
  let userToWrite: string | null = trimmedUser || null;
  if (userToWrite && looksLikeJunk(userToWrite)) {
    console.info(
      '[Oki] user transcript looked like junk, writing null:',
      JSON.stringify(userToWrite)
    );
    userToWrite = null;
  }

  // If both ended up empty, don't write a row at all.
  if (!userToWrite && !trimmedOki) return;

  try {
    const { error } = await c.from('oki_conversations').insert({
      session_id: turn.sessionId,
      user_question: userToWrite,
      oki_answer: trimmedOki || null,
    });
    if (error) {
      console.warn('[Oki] Supabase insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[Oki] Supabase insert threw:', err);
  }
}

/** Generate a short, unguessable session id for grouping turns. */
export function newSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rand}`;
}
