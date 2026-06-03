import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking, updateBookingStatus, request } from '../lib/api';
import { formatDateTime, formatPrice } from '../lib/utils';
import { Card, StatusBadge, Button, Avatar, Spinner, Modal } from '../components/UI';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek,
  addMonths, subMonths, format, isToday, isPast, isSameDay, parseISO,
} from 'date-fns';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const token = () => localStorage.getItem('snails_token');

async function deleteBooking(id)        { return request(`/bookings/${id}`, { method: 'DELETE' }); }
async function saveAdminNotes(id, notes){ return request(`/bookings/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ admin_notes: notes }) }); }
async function rescheduleBooking(id, booked_at) {
  return request(`/bookings/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ booked_at }) });
}
async function fetchSlots(date, serviceIds) {
  const res = await fetch(`${BASE}/availability?date=${date}&service_ids=${serviceIds}`);
  return res.json();
}

function toDateStr(d) { return format(d, 'yyyy-MM-dd'); }

/* ── Reschedule Modal ───────────────────────────────────── */
function RescheduleModal({ open, onClose, booking, onRescheduled }) {
  const [month,    setMonth]    = useState(new Date());
  const [date,     setDate]     = useState(null);
  const [slots,    setSlots]    = useState([]);
  const [slot,     setSlot]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [slotsKey, setSlotsKey] = useState(0);

  const serviceIds = booking?.services?.map(s => s.id).join(',') || booking?.service_id || '';

  useEffect(() => {
    if (!date || !serviceIds) return;
    setSlots([]); setSlot(null); setLoading(true);
    fetchSlots(toDateStr(date), serviceIds)
      .then(d => { setSlots(d.available_slots || []); setSlotsKey(k => k + 1); })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, serviceIds]);

  async function handleSave() {
    if (!slot) return;
    setSaving(true);
    try {
      await rescheduleBooking(booking.id, slot);
      onRescheduled(slot);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  }

  const monthStart = startOfMonth(month);
  const monthEnd   = endOfMonth(month);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays    = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <Modal open={open} onClose={onClose} title="Reschedule booking" width={480}>
      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <button onClick={() => setMonth(m => subMonths(m, 1))} style={navBtn}>‹</button>
        <span style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>{format(month, 'MMMM yyyy')}</span>
        <button onClick={() => setMonth(m => addMonths(m, 1))} style={navBtn}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:10, color:'var(--p400)', padding:'3px 0', fontWeight:500 }}>{d}</div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:18 }}>
        {allDays.map(day => {
          const inMonth  = day.getMonth() === month.getMonth();
          const past     = isPast(day) && !isToday(day);
          const sel      = date && isSameDay(day, date);
          const today    = isToday(day);
          const disabled = past || !inMonth;
          return (
            <button key={day.toString()} disabled={disabled} onClick={() => setDate(day)} style={{
              aspectRatio:'1', border: sel ? '2px solid var(--p600)' : today ? '1.5px solid var(--p300)' : '1.5px solid transparent',
              borderRadius:'var(--radius-md)',
              background: sel ? 'var(--p600)' : today ? 'var(--p100)' : 'transparent',
              color: sel ? 'var(--p100)' : disabled ? 'var(--p200)' : 'var(--p800)',
              fontSize:12, cursor: disabled ? 'default' : 'pointer',
              transition:'all .12s', display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: sel ? '0 3px 10px rgba(212,83,126,.25)' : 'none',
            }}>
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {date && (
        <div key={slotsKey}>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--p700)', marginBottom:8 }}>
            Available times — {format(date, 'EEE d MMM')}
          </div>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:20 }}><Spinner /></div>
          ) : slots.length === 0 ? (
            <div style={{ textAlign:'center', padding:'12px 0', fontSize:13, color:'var(--p400)', background:'var(--p100)', borderRadius:'var(--radius-md)' }}>
              No slots available — try another date
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16 }}>
              {slots.map(s => {
                const sel = slot === s;
                return (
                  <button key={s} onClick={() => setSlot(s)} style={{
                    padding:'9px 4px', fontSize:12, textAlign:'center',
                    border:`1.5px solid ${sel ? 'var(--p600)' : 'var(--p200)'}`,
                    borderRadius:'var(--radius-md)',
                    background: sel ? 'var(--p600)' : '#fff',
                    color: sel ? 'var(--p100)' : 'var(--p700)',
                    fontWeight: sel ? 500 : 400,
                    cursor:'pointer', transition:'all .12s',
                    boxShadow: sel ? '0 3px 10px rgba(212,83,126,.2)' : 'none',
                  }}>
                    {format(parseISO(s), 'HH:mm')}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} loading={saving} disabled={!slot}>
          Confirm reschedule
        </Button>
      </div>
    </Modal>
  );
}

const navBtn = {
  background:'var(--p100)', border:'1px solid var(--p200)',
  borderRadius:'var(--radius-sm)', width:28, height:28,
  fontSize:16, color:'var(--p700)', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
};

/* ── Main component ─────────────────────────────────────── */
export default function BookingDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [booking,    setBooking]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [reschedule, setReschedule] = useState(false);

  useEffect(() => {
    getBooking(id).then(b => { setBooking(b); setNotes(b.admin_notes || ''); }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function changeStatus(status) {
    if (status === 'cancelled' && !window.confirm('Cancel this booking?')) return;
    if (status === 'no_show' && !window.confirm('Mark this client as a no-show?')) return;
    try {
      await updateBookingStatus(id, status);
      const fresh = await getBooking(id);
      setBooking(fresh);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Permanently delete this booking? This cannot be undone.')) return;
    try { await deleteBooking(id); navigate('/bookings'); }
    catch (err) { alert(err.message); }
  }

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await saveAdminNotes(id, notes || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save notes'); }
    finally { setSaving(false); }
  }

  function handleRescheduled(newSlot) {
    setBooking(b => ({ ...b, booked_at: newSlot }));
  }

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner /></div>;
  if (!booking) return <div style={{ padding:28, color:'var(--p600)' }}>Booking not found.</div>;

  const services     = booking.services?.length > 0 ? booking.services : null;
  const serviceLabel = services ? services.map(s => s.name).join(' + ') : booking.service_name || '—';
  const duration     = booking.total_duration_mins ?? booking.duration_mins ?? 0;
  const price        = booking.total_price ?? booking.price ?? 0;
  const isPastBooking = new Date(booking.booked_at) < new Date();
  const canReschedule = (booking.status === 'pending' || booking.status === 'confirmed') && !isPastBooking;

  return (
    <div style={{ padding:28, maxWidth:680 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--p600)',fontSize:20 }}>←</button>
        <div>
          <h1 style={{ fontSize:20, fontWeight:500, color:'var(--p800)' }}>Booking detail</h1>
          <p style={{ fontSize:12, color:'var(--p500)', marginTop:2 }}>ID: {booking.id}</p>
        </div>
      </div>

      {/* Status banner */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'var(--p100)', borderRadius:'var(--radius-md)', border:'1px solid var(--p200)', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, color:'var(--p700)' }}>Status:</span>
          <StatusBadge status={booking.status} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {booking.status === 'pending' && <Button size="sm" onClick={() => changeStatus('confirmed')}>Confirm</Button>}
          {canReschedule && (
            <Button size="sm" variant="outline" onClick={() => setReschedule(true)}>Reschedule</Button>
          )}
          {booking.status === 'confirmed' && isPastBooking && (
            <Button size="sm" variant="danger" style={{ background:'#fce7f3', color:'#9d174d', border:'1px solid #fbcfe8' }} onClick={() => changeStatus('no_show')}>No-show</Button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'no_show' && (
            <Button size="sm" variant="danger" onClick={() => changeStatus('cancelled')}>Cancel</Button>
          )}
          {(booking.status === 'cancelled' || booking.status === 'no_show') && (
            <Button size="sm" variant="danger" onClick={handleDelete}>🗑 Delete permanently</Button>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <h3 style={{ fontSize:12, fontWeight:500, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.5, marginBottom:14 }}>Client</h3>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <Avatar name={booking.client_name} size={40} />
            <div style={{ fontSize:14, fontWeight:500, color:'var(--p800)' }}>{booking.client_name}</div>
          </div>
          <Row label="Phone" value={booking.client_phone || '—'} />
          <Row label="Email" value={booking.client_email || '—'} />
          <button onClick={() => navigate(`/clients/${booking.client_id}`)} style={{ marginTop:12, fontSize:12, color:'var(--p600)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
            View full profile →
          </button>
        </Card>

        <Card>
          <h3 style={{ fontSize:12, fontWeight:500, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.5, marginBottom:14 }}>Appointment</h3>
          <Row label="Service"  value={serviceLabel} />
          <Row label="Date"     value={formatDateTime(booking.booked_at)} />
          <Row label="Duration" value={`${duration} min`} />
          <Row label="Price"    value={formatPrice(price)} highlight />
          {booking.client_notes && <Row label="Client notes" value={booking.client_notes} />}
        </Card>
      </div>

      {services && services.length > 1 && (
        <Card style={{ marginTop:16 }}>
          <h3 style={{ fontSize:12, fontWeight:500, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>Services breakdown</h3>
          {services.map((s, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--p100)', fontSize:13 }}>
              <span style={{ color:'var(--p800)' }}>{s.name}</span>
              <span style={{ color:'var(--p600)' }}>{s.duration_mins} min · {formatPrice(s.price)}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Admin notes */}
      <Card style={{ marginTop:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <h3 style={{ fontSize:12, fontWeight:500, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.5 }}>Admin notes</h3>
          <span style={{ fontSize:11, color:'var(--p400)' }}>Internal — not visible to client</span>
        </div>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Add notes about this booking — preferences, special requests, reminders..."
          rows={3}
          style={{ width:'100%', padding:'9px 12px', fontSize:13, color:'var(--p800)', background:'var(--p50)', border:'1.5px solid var(--p200)', borderRadius:'var(--radius-md)', outline:'none', resize:'vertical', fontFamily:'inherit', transition:'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = 'var(--p500)'}
          onBlur={e => e.target.style.borderColor = 'var(--p200)'}
        />
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <Button size="sm" onClick={handleSaveNotes} loading={saving} style={saved ? { background:'#2e7d32', color:'#fff' } : {}}>
            {saved ? '✓ Saved' : 'Save notes'}
          </Button>
        </div>
      </Card>

      <p style={{ fontSize:11, color:'var(--p400)', marginTop:16 }}>Booked on {formatDateTime(booking.created_at)}</p>

      <RescheduleModal
        open={reschedule}
        onClose={() => setReschedule(false)}
        booking={booking}
        onRescheduled={handleRescheduled}
      />
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
