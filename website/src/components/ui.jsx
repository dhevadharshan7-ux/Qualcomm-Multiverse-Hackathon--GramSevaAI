export function GlassCard({ children, strong = false, style, className = '' }) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} ${className}`} style={{ padding: 20, ...style }}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  onClick,
  type = 'button',
}) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', full ? 'btn-full' : ''].join(' ');
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function Chip({ label, selected, onClick, icon }) {
  return (
    <button type="button" className={`chip ${selected ? 'selected' : ''}`} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

export function StatusBadge({ status }) {
  const label = status.replace(/_/g, ' ');
  return <span className={`badge badge-${status}`}>{label}</span>;
}

export function FormSectionHeader({ icon, title }) {
  return (
    <div className="row" style={{ marginBottom: 4 }}>
      <span style={{ color: 'var(--primary)' }}>{icon}</span>
      <h4>{title}</h4>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}
