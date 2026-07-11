import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { GlassCard, Button, StatusBadge } from '../components/ui';
import { getIdRequest, attachIdRequestDocument } from '../api/orchestrator';

export default function IDRequestDetail() {
  const { id } = useParams();
  const location = useLocation();
  const justSubmitted = Boolean(location.state?.justSubmitted);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [uploading, setUploading] = useState(false);

  function refresh() {
    getIdRequest(id).then(setRequest).catch((err) => setError(err.message));
  }

  useEffect(refresh, [id]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await attachIdRequestDocument(id, file);
      setRequest(result.request);
      setWarnings(result.warnings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (error && !request) {
    return (
      <div className="page">
        <GlassCard>
          <p style={{ color: 'var(--error)' }}>Couldn't load this request: {error}</p>
        </GlassCard>
      </div>
    );
  }
  if (!request) {
    return (
      <div className="page">
        <GlassCard>
          <p>Loading…</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page stack">
      {justSubmitted && (
        <GlassCard strong style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <h2>Request Prepared!</h2>
          <p>Take this to the office below with your original documents.</p>
        </GlassCard>
      )}

      <GlassCard>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Request ID</h3>
          <StatusBadge status={request.status} />
        </div>
        <p style={{ fontFamily: 'monospace', fontSize: 13 }}>{request.id}</p>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <div>
            <label>Document</label>
            <p style={{ textTransform: 'capitalize' }}>{request.id_type.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <label>Update Type</label>
            <p>{request.update_type}</p>
          </div>
          <div>
            <label>Details</label>
            <p>{request.description}</p>
          </div>
          <div>
            <label>Take this to</label>
            <p>
              <strong>{request.authority_office}</strong>
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h4>Upload a photo of the document (optional)</h4>
        <p style={{ marginBottom: 12 }}>
          We'll try to read the name, date of birth, and address to help you double-check your request.
          Full ID numbers are never stored — only the last 4 digits, if present.
        </p>
        <input type="file" accept="image/*,.pdf" onChange={handleFile} disabled={uploading} />
        {uploading && <p style={{ marginTop: 8 }}>Reading document…</p>}
        {warnings.map((w, i) => (
          <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
            {w}
          </p>
        ))}
        {request.extracted_fields && Object.keys(request.extracted_fields).length > 0 && (
          <div className="stack" style={{ marginTop: 12 }}>
            {Object.entries(request.extracted_fields).map(([k, v]) => (
              <div key={k} className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {k.replace(/_/g, ' ')}
                </span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Link to="/id-requests" style={{ textDecoration: 'none' }}>
        <Button variant="outline" full>
          Back
        </Button>
      </Link>
    </div>
  );
}
