import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/id-requests', label: 'ID Help', icon: '🪪' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/grievances', label: 'Grievances', icon: '📋' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">🏛️</div>
        <div>
          <strong style={{ fontSize: 15 }}>Gram Seva AI</strong>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Gram Seva AI v0.3.0</p>
        <p>Offline-first · Snapdragon Hackathon</p>
      </div>
    </aside>
  );
}
