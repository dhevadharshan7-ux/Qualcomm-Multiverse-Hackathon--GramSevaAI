import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { GlassCard, Button, StatusBadge } from '../components/ui';
import { getGrievance } from '../api/orchestrator';

export default function GrievanceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const justSubmitted = Boolean(location.state?.justSubmitted);
  const [grievance, setGrievance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGrievance(id)
      .then(setGrievance)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <GlassCard>
          <p style={{ color: 'var(--error)' }}>Couldn't load this grievance: {error}</p>
        </GlassCard>
      </div>
    );
  }
  if (!grievance) {
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
          <h2>Grievance Registered!</h2>
          <p>Saved locally. Syncing…</p>
        </GlassCard>
      )}

      <GlassCard>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Complaint ID</h3>
          <StatusBadge status={grievance.status} />
        </div>
        <p style={{ fontFamily: 'monospace', fontSize: 13 }}>{grievance.id}</p>
      </GlassCard>

      <GlassCard>
        <div className="stack">
          <div>
            <label>Category</label>
            <p style={{ color: 'var(--text-primary)' }}>{grievance.category.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <label>Description</label>
            <p style={{ color: 'var(--text-primary)' }}>{grievance.description}</p>
          </div>
          {grievance.location && (
            <div>
              <label>Location</label>
              <p style={{ color: 'var(--text-primary)' }}>{grievance.location}</p>
            </div>
          )}
          <div>
            <label>Department</label>
            <p style={{ color: 'var(--text-primary)' }}>{grievance.department}</p>
          </div>
          <div>
            <label>Priority</label>
            <p style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{grievance.priority}</p>
          </div>
        </div>
      </GlassCard>

      {grievance.sensor_check && (
        <GlassCard>
          <FormRow icon="📡" title="Sensor Cross-Check" />
          <p>
            Live device reading:{' '}
            <strong>{JSON.stringify(grievance.sensor_check.value)}</strong>
          </p>
          <p>
            Verdict:{' '}
            <StatusBadge status={grievance.sensor_check.verdict} />
          </p>
        </GlassCard>
      )}

      <div className="row">
        <Link to="/grievances" style={{ flex: 1, textDecoration: 'none' }}>
          <Button variant="outline" full>
            My Grievances
          </Button>
        </Link>
        <Link to="/" style={{ flex: 1, textDecoration: 'none' }}>
          <Button variant="ghost" full>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FormRow({ icon, title }) {
  return (
    <div className="row" style={{ marginBottom: 8 }}>
      <span>{icon}</span>
      <h4>{title}</h4>
    </div>
  );
}
