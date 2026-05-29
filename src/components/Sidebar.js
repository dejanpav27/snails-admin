import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [open, setOpen]                   = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
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
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--p100)',
      }}>
        <img
          src="/logo.png"
          alt="Snails — Nails by Sara Pudar"
          style={{ width: 130, height: 'auto', display: 'block' }}
        />

        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={handleOpen}
            style={{
              width: 32, height: 32,
              background: 'var(--p200)', border: '1px solid var(--p300)',
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0,
              transition: 'background .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--p300)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--p200)'}
            title="Notifications"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4537e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#d4537e', color: '#fff',
                fontSize: 9, fontWeight: 600,
                width: 15, height: 15, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: '110%', right: 0,
              width: 300, maxHeight: 400, overflowY: 'auto',
              background: '#fff', border: '1px solid var(--p200)',
              borderRadius: 12, boxShadow: '0 8px 24px rgba(114,36,62,.12)',
              zIndex: 999,
            }}>
              <div style={{
                padding: '12px 14px', borderBottom: '1px solid var(--p100)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)' }}>Notifications</span>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: 'var(--p400)' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { navigate(`/bookings/${n.booking_id}`); setOpen(false); }}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--p100)',
                      background: n.read ? '#fff' : '#fff8fb',
                      transition: 'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--p100)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#fff8fb'}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 14, marginTop: 1 }}>{notificationIcon(n.type)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 500, color: 'var(--p800)' }}>
                          {notificationLabel(n)}
                        </div>
                        {n.service_label && (
                          <div style={{ fontSize: 11, color: 'var(--p600)', marginTop: 1 }}>{n.service_label}</div>
                        )}
                        {n.booked_at && (
                          <div style={{ fontSize: 11, color: 'var(--p400)', marginTop: 1 }}>{formatDateTime(n.booked_at)}</div>
                        )}
                      </div>
                      {!n.read && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--p600)', marginTop: 4, flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

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
