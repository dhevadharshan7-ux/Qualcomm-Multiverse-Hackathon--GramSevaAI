import { GlassCard, Button } from '../components/ui';
import { firebaseConfigured } from '../firebase';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
];

export default function Profile({ phone, setPhone, language, setLanguage, voiceEnabled, setVoiceEnabled }) {
  return (
    <div className="page stack">
      <GlassCard strong>
        <div className="row">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#fff',
            }}
          >
            👤
          </div>
          <div>
            <h3>{phone || 'Not linked yet'}</h3>
            <p>{firebaseConfigured ? '🟢 Offline sync active' : '⚪ Firebase not configured'}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <h4>Contact</h4>
          <label>Mobile Number</label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p style={{ fontSize: 12 }}>
            Used to link your grievances and ID requests across visits. Full account profile
            (village, panchayat ID) syncs once your citizen record is linked — not fabricated here.
          </p>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <h4>Preferences</h4>
          <div>
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>Whisper AI Enabled</strong>
              <p>Voice Assistance</p>
            </div>
            <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <h4>Support</h4>
          <p>FAQs and Grievance Process — Help Centre</p>
          <p>Direct line to Panchayat — Contact Officer</p>
        </div>
      </GlassCard>

      <p style={{ textAlign: 'center', fontSize: 12 }}>
        Gram Seva AI v0.3.0 · Powered by Qualcomm Hackathon Tech
      </p>
    </div>
  );
}
