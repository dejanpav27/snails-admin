import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getClients, getAvailability, createBookingAdmin } from '../lib/api';
import { toDateString, formatPrice } from '../lib/utils';
import { Card, Button, Input, Select, Textarea, Spinner } from '../components/UI';
import { format, parseISO } from 'date-fns';

export default function NewBooking() {
  const navigate = useNavigate();

  const [services,   setServices]   = useState([]);
  const [clients,    setClients]    = useState([]);
  const [slots,      setSlots]      = useState([]);
  const [loadSlots,  setLoadSlots]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  // FIX: service_ids is now an array to support multi-service bookings
  const [form, setForm] = useState({
    client_id:    '',
    service_ids:  [],
    date:         toDateString(new Date()),
    booked_at:    '',
    client_notes: '',
  });

  useEffect(() => {
    Promise.all([getServices(), getClients()])
      .then(([svcs, cls]) => { setServices(svcs); setClients(cls); })
      .catch(console.error);
  }, []);

  // Load slots whenever date or selected services change
  useEffect(() => {
    if (!form.service_ids.length || !form.date) return;
    setSlots([]); setForm(f => ({ ...f, booked_at: '' }));
    setLoadSlots(true);
    // Pass all selected service IDs to get combined availability
    getAvailability(form.date, null, form.service_ids)
      .then(data => setSlots(data.available_slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadSlots(false));
  }, [form.service_ids, form.date]); // eslint-disable-line

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Toggle a service in/out of the selection
  function toggleService(id) {
    setForm(f => {
      const already = f.service_ids.includes(id);
      return {
        ...f,
        service_ids: already
          ? f.service_ids.filter(s => s !== id)
          : [...f.service_ids, id],
        booked_at: '', // reset slot when services change
      };
    });
  }

  const selectedServices = services.filter(s => form.service_ids.includes(s.id));
  const totalDuration    = selectedServices.reduce((s, x) => s + x.duration_mins, 0);
  const totalPrice       = selectedServices.reduce((s, x) => s + Number(x.price), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.client_id || !form.service_ids.length || !form.booked_at) {
      setError('Please fill in client, service and time slot'); return;
    }
    setSaving(true); setError('');
    try {
      const booking = await createBookingAdmin({
        client_id:    form.client_id,
        service_ids:  form.service_ids,
        booked_at:    form.booked_at,
        client_notes: form.client_notes || null,
        status:       'confirmed',
      });
      setSuccess(true);
      setTimeout(() => navigate(`/bookings/${booking.id}`), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (success) return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--p600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--p100)', marginBottom: 16 }}>✓</div>
      <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--p800)', marginBottom: 6 }}>Booking confirmed!</h2>
      <p style={{ fontSize: 13, color: 'var(--p600)' }}>Redirecting to booking detail…</p>
    </div>
  );

  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p600)', fontSize: 20 }}>←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>New booking</h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 2 }}>Add an appointment manually</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Client */}
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--p700)', marginBottom: 14 }}>Client</h3>
          <Select label="Select client *" value={form.client_id} onChange={set('client_id')}>
            <option value="">Choose a client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
          </Select>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            style={{ marginTop: 8, fontSize: 12, color: 'var(--p600)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            + Add a new client first
          </button>
        </Card>

        {/* Service — FIX: multi-select via toggle buttons */}
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--p700)', marginBottom: 14 }}>Services</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.map(s => {
              const selected = form.service_ids.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `1px solid ${selected ? 'var(--p600)' : 'var(--p200)'}`,
                    background: selected ? 'var(--p100)' : 'var(--white)',
                    color: 'var(--p800)', textAlign: 'left',
                    transition: 'all .12s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: selected ? 500 : 400 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--p500)', marginTop: 2 }}>{s.duration_mins} min · {formatPrice(s.price)}</div>
                  </div>
                  {selected && <span style={{ fontSize: 16, color: 'var(--p600)' }}>✓</span>}
                </button>
              );
            })}
          </div>
          {selectedServices.length > 1 && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--p100)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--p700)', display: 'flex', gap: 16 }}>
              <span>⏱ Total: {totalDuration} min</span>
              <span>💰 Total: {formatPrice(totalPrice)}</span>
            </div>
          )}
        </Card>

        {/* Date & time */}
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--p700)', marginBottom: 14 }}>Date & time</h3>
          <Input label="Date *" type="date" value={form.date} onChange={set('date')} style={{ marginBottom: 14 }} />

          {!form.service_ids.length ? (
            <p style={{ fontSize: 12, color: 'var(--p400)' }}>Select a service to see available slots</p>
          ) : loadSlots ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <Spinner size={16} /> <span style={{ fontSize: 12, color: 'var(--p600)' }}>Loading slots…</span>
            </div>
          ) : slots.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--p500)' }}>No slots available on this date</p>
          ) : (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--p700)', display: 'block', marginBottom: 8 }}>Available times *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {slots.map(slot => {
                  const selected = form.booked_at === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, booked_at: slot }))}
                      style={{
                        padding: '7px 4px', fontSize: 12, textAlign: 'center',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: `1px solid ${selected ? 'var(--p600)' : 'var(--p200)'}`,
                        background: selected ? 'var(--p600)' : 'var(--white)',
                        color: selected ? 'var(--p100)' : 'var(--p700)',
                        fontWeight: selected ? 500 : 400,
                        transition: 'all .12s',
                      }}
                    >
                      {format(parseISO(slot), 'HH:mm')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card>
          <Textarea
            label="Notes"
            value={form.client_notes}
            onChange={set('client_notes')}
            placeholder="Allergies, design requests, preferences…"
          />
        </Card>

        {/* Summary */}
        {form.client_id && form.service_ids.length > 0 && form.booked_at && (
          <div style={{ padding: '14px 16px', background: 'var(--p100)', border: '1px solid var(--p200)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            <div style={{ fontWeight: 500, color: 'var(--p800)', marginBottom: 8 }}>Booking summary</div>
            {[
              ['Client',    clients.find(c => c.id === form.client_id)?.name],
              ['Services',  selectedServices.map(s => s.name).join(' + ')],
              ['Date',      format(parseISO(form.booked_at), 'EEE d MMM yyyy · HH:mm')],
              ['Duration',  `${totalDuration} min`],
              ['Price',     formatPrice(totalPrice)],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--p700)' }}>
                <span style={{ color: 'var(--p600)' }}>{l}</span>
                <span style={{ fontWeight: l === 'Price' ? 500 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="outline" onClick={() => navigate(-1)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</Button>
          <Button type="submit" loading={saving} style={{ flex: 2, justifyContent: 'center' }}>Confirm booking</Button>
        </div>
      </form>
    </div>
  );
}
