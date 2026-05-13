import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking, updateBookingStatus } from '../lib/api';
import { formatDateTime, formatPrice } from '../lib/utils';
import { Card, StatusBadge, Button, Avatar, Spinner } from '../components/UI';

export default function BookingDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBooking(id).then(setBooking).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(status) {
    if (status === 'cancelled' && !window.confirm('Cancel this booking?')) return;
    const updated = await updateBookingStatus(id, status);
    setBooking(b => ({ ...b, status: updated.booking.status }));
  }

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner /></div>;
  if (!booking) return <div style={{ padding: 28, color: 'var(--p600)' }}>Booking not found.</div>;

  return (
    <div style={{ padding: 28, maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--p600)',fontSize:20 }}>←</button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--p800)' }}>Booking detail</h1>
          <p style={{ fontSize: 12, color: 'var(--p500)', marginTop: 2 }}>ID: {booking.id}</p>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--p100)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--p200)', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--p700)' }}>Status:</span>
          <StatusBadge status={booking.status} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {booking.status === 'pending' && <Button size="sm" onClick={() => changeStatus('confirmed')}>Confirm</Button>}
          {booking.status !== 'cancelled' && <Button size="sm" variant="danger" onClick={() => changeStatus('cancelled')}>Cancel</Button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Client */}
        <Card>
          <h3 style={{ fontSize: 12, fontWeight: 500, color: 'var(--p600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Client</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Avatar name={booking.client_name} size={40} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--p800)' }}>{booking.client_name}</div>
            </div>
          </div>
          <Row label="Phone" value={booking.client_phone || '—'} />
          <Row label="Email" value={booking.client_email || '—'} />
          <button
            onClick={() => navigate(`/clients/${booking.client_id}`)}
            style={{ marginTop: 12, fontSize: 12, color: 'var(--p600)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            View full profile →
          </button>
        </Card>

        {/* Appointment */}
        <Card>
          <h3 style={{ fontSize: 12, fontWeight: 500, color: 'var(--p600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Appointment</h3>
          <Row label="Service"  value={booking.service_name} />
          <Row label="Date"     value={formatDateTime(booking.booked_at)} />
          <Row label="Duration" value={`${booking.duration_mins} min`} />
          <Row label="Price"    value={formatPrice(booking.price)} highlight />
          {booking.client_notes && <Row label="Notes" value={booking.client_notes} />}
        </Card>
      </div>

      <p style={{ fontSize: 11, color: 'var(--p400)', marginTop: 16 }}>
        Booked on {formatDateTime(booking.created_at)}
      </p>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--p100)', fontSize:13 }}>
      <span style={{ color:'var(--p600)' }}>{label}</span>
      <span style={{ color: highlight ? 'var(--p600)' : 'var(--p800)', fontWeight: highlight ? 500 : 400 }}>{value}</span>
    </div>
  );
}
