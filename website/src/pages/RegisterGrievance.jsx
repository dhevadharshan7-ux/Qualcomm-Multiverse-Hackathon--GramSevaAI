import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, Chip, FormSectionHeader, Field } from '../components/ui';
import VoiceRecorder from '../components/VoiceRecorder';
import { createGrievance, orchestrateVoice } from '../api/orchestrator';

const CATEGORIES = [
  { value: 'water', label: 'Water Supply', icon: '💧' },
  { value: 'streetlight', label: 'Street Light', icon: '💡' },
  { value: 'road_damage', label: 'Road Damage', icon: '🛣️' },
  { value: 'sanitation', label: 'Sanitation', icon: '🗑️' },
  { value: 'electricity', label: 'Electricity', icon: '⚡' },
  { value: 'corruption', label: 'Corruption', icon: '⚠️' },
  { value: 'other', label: 'Other', icon: '⋯' },
];

export default function RegisterGrievance({ language }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('water');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const grievance = await createGrievance({
        citizen_id: phone || null,
        category,
        description,
        location: location || null,
        priority: category === 'corruption' ? 'high' : 'medium',
        source_channel: 'form',
      });
      navigate(`/grievances/${grievance.id}`, { state: { justSubmitted: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVoiceRecorded(blob) {
    setVoiceBusy(true);
    setError(null);
    try {
      const result = await orchestrateVoice({ audioBlob: blob, language, citizenId: phone || null });
      if (result.intent === 'new_grievance' && result.downstream?.resource_id) {
        navigate(`/grievances/${result.downstream.resource_id}`, { state: { justSubmitted: true } });
      } else {
        setError(
          `Voice input was understood as "${result.intent.replace(/_/g, ' ')}", not a grievance. ` +
            'Try the form below, or rephrase your complaint.'
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setVoiceBusy(false);
    }
  }

  return (
    <div className="page stack">
      <GlassCard strong>
        <h2>Register Grievance</h2>
        <p>Gram Seva AI • Village Service</p>
      </GlassCard>

      <GlassCard>
        <FormSectionHeader icon="🎙️" title="Describe by voice (fastest)" />
        <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={voiceBusy} />
        {voiceBusy && <p style={{ textAlign: 'center', marginTop: 8 }}>Transcribing and classifying…</p>}
      </GlassCard>

      <form onSubmit={handleSubmit}>
        <div className="stack">
          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="👤" title="Personal Details" />
              <Field label="Mobile Number">
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="📍" title="Location & Village" />
              <Field label="Location">
                <input
                  placeholder="Village / ward / landmark"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Field>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="🏷️" title="Grievance Category" />
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c.value}
                    icon={c.icon}
                    label={c.label}
                    selected={category === c.value}
                    onClick={() => setCategory(c.value)}
                  />
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="📝" title="Complaint Details" />
              <Field label="Describe the Problem">
                <textarea
                  placeholder="Explain the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Field>
            </div>
          </GlassCard>

          {error && (
            <GlassCard style={{ borderColor: 'var(--error)' }}>
              <p style={{ color: 'var(--error)' }}>{error}</p>
            </GlassCard>
          )}

          <Button type="submit" full disabled={submitting || !description}>
            {submitting ? 'Submitting…' : 'Submit Grievance'}
          </Button>
        </div>
      </form>
    </div>
  );
}
