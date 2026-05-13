import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, updateBookingStatus } from '../lib/api';
import { formatTime, formatDate, formatPrice, toDateString } from '../lib/utils';
import { Card, StatCard, StatusBadge, Button, Avatar, Spinner, Empty } from '../components/UI';
import { useAuth } from '../lib/AuthContext';

export default function Dashboard() {
  const { admin } = useAuth();
  const navigate  = useNavigate();
  const today     = toDateString(new Date());

  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getBookings({ date: today })
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [today]);

  async function confirm(id) {
    await updateBookingStatus(id, 'confirmed');
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'confirmed' } : x));
  }
  async function cancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await updateBookingStatus(id, 'cancelled');
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'cancelled' } : x));
  }

  const active    = bookings.filter(b => b.status !== 'cancelled');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const pending   = bookings.filter(b => b.status === 'pending');
  const revenue   = active.reduce((s, b) => s + Number(b.service.price), 0);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>
            {greeting}{admin?.name ? `, ${admin.name.split(' ')[0]}` : ''} ✦
          </h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 3 }}>
            {formatDate(new Date().toISOString())}
          </p>
        </div>
        <Button onClick={() => navigate('/new')}>+ New booking</Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Today's bookings" value={active.length} sub="appointments" />
        <StatCard label="Confirmed" value={confirmed.length} sub="ready" />
        <StatCard label="Pending" value={pending.length} sub="needs action" />
        <StatCard label="Today's revenue" value={formatPrice(revenue)} sub="from active bookings" />
      </div>

      {/* Booking list */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--p800)' }}>Today's schedule</h2>
          <button onClick={() => navigate('/bookings')} style={{ fontSize: 12, color: 'var(--p600)', background: 'none', border: 'none', cursor: 'pointer' }}>
            View all →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>
        ) : bookings.length === 0 ? (
          <Empty message="No appointments today" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookings
              .sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at))
              .map(booking => (
                <BookingRow key={booking.id} booking={booking} onConfirm={confirm} onCancel={cancel} />
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function BookingRow({ booking, onConfirm, onCancel }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/bookings/${booking.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px',
        background: 'var(--p100)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--p200)', cursor: 'pointer',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--p400)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--p200)'}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)', minWidth: 44 }}>
        {formatTime(booking.booked_at)}
      </div>
      <Avatar name={booking.client.name} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)' }}>{booking.client.name}</div>
        <div style={{ fontSize: 11, color: 'var(--p600)' }}>
          {booking.service.name} · {booking.service.duration_mins} min · {formatPrice(booking.service.price)}
        </div>
      </div>
      <StatusBadge status={booking.status} />
      {booking.status === 'pending' && (
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" onClick={() => onConfirm(booking.id)}>Confirm</Button>
          <Button size="sm" variant="ghost" onClick={() => onCancel(booking.id)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
