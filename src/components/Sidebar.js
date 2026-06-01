import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button } from './UI';
import { getNotifications, markAllNotificationsRead } from '../lib/api';
import { formatDateTime } from '../lib/utils';

const NAV = [
  { to: '/',          label: 'Dashboard',   icon: '◈' },
  { to: '/calendar',  label: 'Calendar',    icon: '◻' },
  { to: '/bookings',  label: 'Bookings',    icon: '◉' },
  { to: '/clients',   label: 'Clients',     icon: '◎' },
  { to: '/services',  label: 'Services',    icon: '✦' },
  { to: '/schedule',  label: 'Schedule',    icon: '⏱' },
  { to: '/new',       label: 'New booking', icon: '+' },
];

function notificationLabel(n) {
  switch (n.type) {
    case 'new_booking': return `New booking — ${n.client_name}`;
    case 'confirmed':   return `Confirmed — ${n.client_name}`;
    case 'cancelled':   return `Cancelled — ${n.client_name}`;
    default:            return n.client_name;
  }
}

function notificationIcon(type) {
  switch (type) {
    case 'new_booking': return '🔔';
    case 'confirmed':   return '✓';
    case 'cancelled':   return '✕';
    default:            return '•';
  }
}

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const bellRef = useRef(null);

  // Sliding indicator
  const navRef   = useRef(null);
  const pillRef  = useRef(null);
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 0, opacity: 0 });

  useEffect(() => {
    if (!navRef.current) return;
    const active = navRef.current.querySelector('[data-active="true"]');
    if (active) {
      const { offsetTop, offsetHeight } = active;
      setPillStyle({ top: offsetTop, height: offsetHeight, opacity: 1 });
    }
  }, [location.pathname]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleOpen() {
    setOpen(o => !o);
    if (!open && unread > 0) {
      try {
        await markAllNotificationsRead();
        setUnread(0);
        setNotifications(n => n.map(x => ({ ...x, read: true })));
      } catch {}
    }
  }

  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: 'var(--p100)',
      borderRight: '1px solid var(--p200)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--p200)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--p100)',
      }}>
        <img
          src="/logo.png"
          alt="Snails — Nails by Sara Pudar"
          style={{ width: 130, height: 'auto', display: 'block' }}
        />
      </div>

      <nav ref={navRef} style={{ flex: 1, padding: '12px 0', overflowY: 'auto', position: 'relative' }}>
        {/* Sliding pill indicator */}
        <div ref={pillRef} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: pillStyle.top,
          height: pillStyle.height,
          background: 'var(--p200)',
          borderLeft: '3px solid var(--p600)',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          transition: 'top .2s cubic-bezier(.4,0,.2,1), height .2s cubic-bezier(.4,0,.2,1)',
          opacity: pillStyle.opacity,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 20px',
            fontSize: 13, fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--p800)' : 'var(--p700)',
            textDecoration: 'none',
            position: 'relative', zIndex: 1,
            transition: 'color .15s',
          })}
          data-active={location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'true' : 'false'}
          >
            {({ isActive }) => (
              <>
                <span style={{ fontSize: 16, opacity: isActive ? 1 : .7, transition: 'opacity .15s' }}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--p200)' }}>
        {admin && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--p800)' }}>{admin.name}</div>
            <div style={{ fontSize: 11, color: 'var(--p600)' }}>{admin.email}</div>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
          Sign out
        </Button>
      </div>
    </aside>
  );
}
