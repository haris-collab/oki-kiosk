import React from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import Avatar from './components/Avatar';
import PushToTalkButton from './components/PushToTalkButton';
import StatusBar from './components/StatusBar';
import DebugTranscript from './components/DebugTranscript';
import ThreadBackground from './components/ThreadBackground';
import PromptChips from './components/PromptChips';
import Splash from './components/Splash';

const App: React.FC = () => {
  const {
    status,
    errorMessage,
    micLevel,
    outputLevel,
    lastUserText,
    lastOkiText,
    isMicOn,
    start,
    startListening,
    stopListening,
    resetSession,
  } = useLiveSession();

  // Show floating prompt chips only when Oki is idle/ready, so they
  // don't fight visually while a conversation is active.
  const showChips = status === 'ready' || status === 'connecting';

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <ThreadBackground />

      {status === 'awaiting-tap' && <Splash onBegin={start} />}

      <StatusBar status={status} onReset={resetSession} />

      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateRows: 'minmax(0, 1fr) auto',
          padding: '0 24px 28px',
          rowGap: 18,
          minHeight: 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Stage: avatar + prompt chips overlay */}
        <section
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            minHeight: 0,
          }}
        >
          <PromptChips visible={showChips} />

          <Avatar
            status={status}
            isMicOn={isMicOn}
            micLevel={micLevel}
            outputLevel={outputLevel}
          />

          <div style={{ textAlign: 'center', maxWidth: 720, padding: '0 16px', zIndex: 2 }}>
            <h1
              className="display"
              style={{
                fontSize: 'clamp(28px, 3.4vw, 42px)',
                lineHeight: 1.05,
                margin: 0,
                color: 'var(--ink-900)',
              }}
            >
              Hi, I&rsquo;m{' '}
              <span style={{ color: 'var(--thread-coral)' }}>Oki</span>.
            </h1>
            <p
              style={{
                marginTop: 10,
                color: 'var(--ink-500)',
                fontSize: 'clamp(14px, 1.15vw, 16px)',
                lineHeight: 1.55,
              }}
            >
              Your octopus guide at <strong style={{ color: 'var(--ink-700)' }}>ParSEC Jayanagar</strong>.
              Hold the button and ask me anything — galleries, science, or how the world works.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              style={{
                marginTop: 4,
                padding: '10px 16px',
                borderRadius: 12,
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.3)',
                color: '#991b1b',
                fontSize: 13,
                maxWidth: 640,
                textAlign: 'center',
              }}
            >
              {errorMessage}
            </div>
          )}
        </section>

        {/* PTT footer — its own row, can never overlap content */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <PushToTalkButton
            status={status}
            isMicOn={isMicOn}
            onStart={startListening}
            onStop={stopListening}
          />
        </section>
      </main>

      {/* Dev-only transcript ribbon (kept in code, hidden in production).
          Set `hide={false}` while debugging to see what Oki heard/said. */}
      <DebugTranscript userText={lastUserText} okiText={lastOkiText} hide />
    </div>
  );
};

export default App;
