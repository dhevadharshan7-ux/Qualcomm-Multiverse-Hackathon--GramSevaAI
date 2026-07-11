import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, Button, Chip } from '../components/ui';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
];

const FEATURES = [
  { icon: '🎙️', title: 'Voice Complaints', desc: 'Simply speak your issue in your local language.' },
  { icon: '📍', title: 'Auto Location', desc: 'Precise location tagging for village infrastructure issues.' },
  { icon: '🤖', title: 'AI Classification', desc: 'Complaints are automatically categorized and routed for officers.' },
  { icon: '🪪', title: 'ID Assistance', desc: 'Get help preparing Aadhaar, PAN, and Driving Licence update requests.' },
];

export default function Home({ language, setLanguage }) {
  return (
    <div className="page stack">
      <GlassCard strong>
        <div className="stack" style={{ alignItems: 'flex-start' }}>
          <div
            className="row"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            🏛️
          </div>
          <div>
            <h1 style={{ fontSize: 32 }}>Gram Seva AI</h1>
            <p style={{ fontSize: 16 }}>Empowering Villages with AI</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <h3>Choose Language / भाषा चुनें</h3>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {LANGUAGES.map((lang) => (
              <Chip
                key={lang.code}
                label={lang.label}
                selected={language === lang.code}
                onClick={() => setLanguage(lang.code)}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <h3>How it helps you</h3>
          {FEATURES.map((f) => (
            <div className="row" key={f.title} style={{ alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="stack" style={{ alignItems: 'center' }}>
          <Link to="/grievances/new" style={{ textDecoration: 'none', width: '100%' }}>
            <Button full>Get Started →</Button>
          </Link>
          <p className="row" style={{ fontSize: 12, justifyContent: 'center' }}>
            🔒 Your data is secure and offline-first
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
