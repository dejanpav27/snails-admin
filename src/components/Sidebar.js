import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const NAV = [
  { to: '/',          label: 'Dashboard',   icon: '◈' },
  { to: '/calendar',  label: 'Calendar',    icon: '◻' },
  { to: '/bookings',  label: 'Bookings',    icon: '◉' },
  { to: '/clients',   label: 'Clients',     icon: '◎' },
  { to: '/services',  label: 'Services',    icon: '✦' },
  { to: '/new',       label: 'New booking', icon: '+' },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();

  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: 'var(--p100)',
      borderRight: '1px solid var(--p200)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: '1px solid var(--p200)',
        background: '#1a0a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src="/logo.png"
          alt="Snails — Nails by Sara Pudar"
          style={{ width: 140, height: 'auto', display: 'block' }}
        />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 20px',
            fontSize: 13, fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--p800)' : 'var(--p700)',
            background: isActive ? 'var(--p200)' : 'transparent',
            borderLeft: `3px solid ${isActive ? 'var(--p600)' : 'transparent'}`,
            transition: 'background .15s',
            textDecoration: 'none',
          })}>
            <span style={{ fontSize: 16, opacity: .8 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin info + logout */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--p200)' }}>
        {admin && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--p800)' }}>{admin.name}</div>
            <div style={{ fontSize: 11, color: 'var(--p600)' }}>{admin.email}</div>
          </div>
        )}
        <button onClick={logout} style={{
          width: '100%', padding: '7px 12px', fontSize: 12,
          background: 'transparent', border: '1px solid var(--p300)',
          borderRadius: 'var(--radius-md)', color: 'var(--p700)',
          cursor: 'pointer', textAlign: 'left',
        }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
