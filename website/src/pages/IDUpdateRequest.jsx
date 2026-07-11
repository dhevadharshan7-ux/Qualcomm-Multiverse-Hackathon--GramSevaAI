import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, Chip, FormSectionHeader, Field } from '../components/ui';
import VoiceRecorder from '../components/VoiceRecorder';
import { createIdRequest, orchestrateVoice } from '../api/orchestrator';

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar', icon: '🪪' },
  { value: 'pan', label: 'PAN Card', icon: '💳' },
  { value: 'driving_license', label: 'Driving Licence', icon: '🚗' },
  { value: 'other', label: 'Other', icon: '📄' },
];

export default function IDUpdateRequest({ language }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('aadhaar');
  const [updateType, setUpdateType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const request = await createIdRequest({
        citizen_id: phone || null,
        id_type: idType,
        update_type: updateType || 'unspecified',
        description,
        source_channel: 'form',
      });
      navigate(`/id-requests/${request.id}`, { state: { justSubmitted: true } });
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
      if (result.intent === 'id_update_request' && result.downstream?.resource_id) {
        navigate(`/id-requests/${result.downstream.resource_id}`, { state: { justSubmitted: true } });
      } else {
        setError(
          `Voice input was understood as "${result.intent.replace(/_/g, ' ')}", not an ID request. ` +
            'Try the form below, or rephrase.'
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
        <h2>Aadhaar / PAN / Driving Licence Help</h2>
        <p>Gram Seva AI • Document Assistance</p>
      </GlassCard>

      <GlassCard style={{ borderLeft: '3px solid var(--tertiary)' }}>
        <p>
          <strong>Important:</strong> we cannot change your Aadhaar, PAN, or Driving Licence directly —
          no system outside UIDAI/NSDL/Parivahan can. We prepare your request and tell you exactly where
          to take it (Common Service Centre, PAN centre, or RTO) with the right documents, so your visit
          takes one trip instead of several.
        </p>
      </GlassCard>

      <GlassCard>
        <FormSectionHeader icon="🎙️" title="Describe by voice" />
        <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={voiceBusy} />
        {voiceBusy && <p style={{ textAlign: 'center', marginTop: 8 }}>Transcribing and classifying…</p>}
      </GlassCard>

      <form onSubmit={handleSubmit}>
        <div className="stack">
          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="👤" title="Contact" />
              <Field label="Mobile Number">
                <input type="tel" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="🪪" title="Which document?" />
              <div className="row" style={{ flexWrap: 'wrap' }}>
                {ID_TYPES.map((t) => (
                  <Chip key={t.value} icon={t.icon} label={t.label} selected={idType === t.value} onClick={() => setIdType(t.value)} />
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="stack">
              <FormSectionHeader icon="✏️" title="What needs updating?" />
              <Field label="Update Type">
                <input
                  placeholder="e.g. address change, name correction, mobile update"
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value)}
                />
              </Field>
              <Field label="Details">
                <textarea
                  placeholder="Explain what's wrong or what needs to change..."
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
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}
