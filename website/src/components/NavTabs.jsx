import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/grievances', label: 'Grievances', icon: '📋' },
  { to: '/id-requests', label: 'ID Help', icon: '🪪' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function NavTabs() {
  return (
    <nav className="nav-tabs glass-strong">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span style={{ fontSize: 18 }}>{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
