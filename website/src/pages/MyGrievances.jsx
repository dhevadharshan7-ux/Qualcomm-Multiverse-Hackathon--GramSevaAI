import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, StatusBadge, Button } from '../components/ui';
import { subscribeLive } from '../api/firebaseBridge';
import { firebaseConfigured } from '../firebase';

export default function MyGrievances() {
  const [grievances, setGrievances] = useState([]);

  useEffect(() => {
    // Reads the Node backend's 60-second Postgres -> gram_seva_live mirror
    // (see Gram_Seva_Ai/backend/src/firebase/liveSync.js) — this is the
    // cross-device "My Grievances" view, distinct from the single-record
    // lookup on the detail page which always hits Python directly.
    const unsubscribe = subscribeLive('grievance', setGrievances);
    return unsubscribe;
  }, []);

  const total = grievances.length;
  const pending = grievances.filter((g) => g.status === 'submitted' || g.status === 'in_progress').length;
  const resolved = grievances.filter((g) => g.status === 'resolved').length;

  return (
    <div className="page stack">
      <GlassCard strong>
        <h2>My Grievances</h2>
        <p>Track and manage your village reports</p>
      </GlassCard>

      {!firebaseConfigured && (
        <GlassCard>
          <p>
            Live cross-device grievance history needs Firebase configured (see
            <code> website/.env.example</code>). You can still open a grievance directly if you have
            its link from the confirmation page.
          </p>
        </GlassCard>
      )}

      <div className="row">
        <GlassCard style={{ flex: 1, textAlign: 'center' }}>
          <h2>{total}</h2>
          <p>Total</p>
        </GlassCard>
        <GlassCard style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--warning)' }}>{pending}</h2>
          <p>Pending</p>
        </GlassCard>
        <GlassCard style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--success)' }}>{resolved}</h2>
          <p>Resolved</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="stack">
          <h3>Recent Submissions</h3>
          {grievances.length === 0 && <p>No grievances yet.</p>}
          {grievances.map((g) => (
            <Link
              key={g.id}
              to={`/grievances/${g.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                className="row"
                style={{
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderTop: '1px solid var(--glass-border)',
                }}
              >
                <div>
                  <strong>{g.location || 'Unknown location'}</strong>
                  <p style={{ textTransform: 'capitalize' }}>{g.category?.replace(/_/g, ' ')}</p>
                </div>
                <StatusBadge status={g.status} />
              </div>
            </Link>
          ))}
        </div>
      </GlassCard>

      <Link to="/grievances/new" style={{ textDecoration: 'none' }}>
        <Button full>File a New Grievance</Button>
      </Link>
    </div>
  );
}
