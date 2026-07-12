import { useState, useRef, useEffect } from 'react';
import { GlassCard, Button } from '../components/ui';
import VoiceRecorder from '../components/VoiceRecorder';
import { askChat, askChatVoice } from '../api/orchestrator';

const STARTER_QUESTIONS = [
  'What is PM-KISAN?',
  'How do I apply for Ayushman Bharat?',
  'What schemes exist for farmers?',
  'How does MGNREGA work?',
];

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Ask me about government schemes, eligibility, or how to apply. I only answer from our real scheme catalog, and I'll say so if I don't have the information — for anything else, your Panchayat office can help.",
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const threadEndRef = useRef(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendQuestion(question) {
    if (!question.trim() || busy) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setBusy(true);
    try {
      const result = await askChat(question);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.answer,
          refused: !result.on_topic,
          sources: result.matched_schemes,
          disclaimer: result.disclaimer,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Something went wrong: ${err.message}`, refused: true }]);
    } finally {
      setBusy(false);
    }
  }

  async function handleVoice(blob) {
    setShowVoice(false);
    setBusy(true);
    setMessages((prev) => [...prev, { role: 'user', text: '🎙️ (voice question)' }]);
    try {
      const result = await askChatVoice(blob);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.answer,
          refused: !result.on_topic,
          sources: result.matched_schemes,
          disclaimer: result.disclaimer,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Something went wrong: ${err.message}`, refused: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page stack">
      <GlassCard strong>
        <h2>Ask Gram Seva AI</h2>
        <p>Questions about government schemes and policies — grounded in our real catalog, not guesses.</p>
      </GlassCard>

      <GlassCard>
        <div className="chat-thread">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role} ${m.refused ? 'refused' : ''}`}>
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <div className="chat-sources">
                  {m.sources.map((s, j) => (
                    <span key={j}>
                      📄 {s.scheme_name}
                      {s.scheme_url ? ` — ${s.scheme_url}` : ''}
                    </span>
                  ))}
                </div>
              )}
              {m.disclaimer && <div className="chat-sources">⚠️ {m.disclaimer}</div>}
            </div>
          ))}
          {busy && <div className="chat-bubble assistant">Thinking…</div>}
          <div ref={threadEndRef} />
        </div>
      </GlassCard>

      {messages.length <= 1 && (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {STARTER_QUESTIONS.map((q) => (
            <Button key={q} variant="outline" size="sm" onClick={() => sendQuestion(q)}>
              {q}
            </Button>
          ))}
        </div>
      )}

      {showVoice ? (
        <GlassCard>
          <VoiceRecorder onRecorded={handleVoice} disabled={busy} />
          <Button variant="ghost" size="sm" onClick={() => setShowVoice(false)}>
            Cancel
          </Button>
        </GlassCard>
      ) : (
        <div className="chat-input-row">
          <input
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendQuestion(input)}
            disabled={busy}
          />
          <button className="icon-btn" onClick={() => setShowVoice(true)} disabled={busy} aria-label="Ask by voice">
            🎤
          </button>
          <Button onClick={() => sendQuestion(input)} disabled={busy || !input.trim()}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
