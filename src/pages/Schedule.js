import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, Button, Spinner } from '../components/UI';

const BASE  = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const token = () => localStorage.getItem('snails_token');

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIMES = [];
for (let h = 7; h <= 22; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIMES.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }
}

async function fetchSchedule() {
  const res = await fetch(`${BASE}/schedule`);
  return res.json();
}
async function updateDay(day, data) {
  const res = await fetch(`${BASE}/schedule/${day}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(data),
  });
  return res.json();
}
async function fetchBlocks() {
  const res = await fetch(`${BASE}/blocked-slots`);
  return res.json();
}
async function createBlock(data) {
  const res = await fetch(`${BASE}/blocked-slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
  return res.json();
}
async function deleteBlock(id) {
  await fetch(`${BASE}/blocked-slots/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token()}` },
  });
}

const EMPTY_BLOCK = { date: '', is_full_day: false, start_time: '09:00', end_time: '10:00', reason: '' };

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(null);
  const [saved,    setSaved]    = useState(null);

  const [blocks,       setBlocks]      = useState([]);
  const [blocksLoading,setBlocksLoading] = useState(true);
  const [showForm,     setShowForm]    = useState(false);
  const [form,         setForm]        = useState(EMPTY_BLOCK);
  const [formSaving,   setFormSaving]  = useState(false);
  const [formError,    setFormError]   = useState('');

  useEffect(() => {
    fetchSchedule().then(setSchedule).catch(console.error).finally(() => setLoading(false));
    fetchBlocks().then(setBlocks).catch(console.error).finally(() => setBlocksLoading(false));
  }, []);

  /* ── schedule handlers ── */
  function handleChange(dayOfWeek, field, value) {
    setSchedule(s => s.map(d => d.day_of_week === dayOfWeek ? { ...d, [field]: value } : d));
  }
  async function handleSave(dayOfWeek) {
    const day = schedule.find(d => d.day_of_week === dayOfWeek);
    setSaving(dayOfWeek);
    try {
      const result = await updateDay(dayOfWeek, { is_open: day.is_open, open_time: day.open_time, close_time: day.close_time, break_start: day.break_start || null, break_end: day.break_end || null });
      setSchedule(s => s.map(d => d.day_of_week === dayOfWeek ? result : d));
      setSaved(dayOfWeek);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) { alert('Failed to save: ' + err.message); }
    finally { setSaving(null); }
  }

  /* ── block handlers ── */
  async function handleAddBlock(e) {
    e.preventDefault();
    setFormError('');
    setFormSaving(true);
    try {
      const block = await createBlock(form);
      setBlocks(b => [...b, block].sort((a, b) => a.date.localeCompare(b.date) || (a.start_time||'').localeCompare(b.start_time||'')));
      setShowForm(false);
      setForm(EMPTY_BLOCK);
    } catch (err) { setFormError(err.message); }
    finally { setFormSaving(false); }
  }
  async function handleDeleteBlock(id) {
    await deleteBlock(id);
    setBlocks(b => b.filter(x => x.id !== id));
  }

  function formatBlockDate(dateStr) {
    // dateStr is YYYY-MM-DD from DB
    return format(parseISO(dateStr), 'EEE d MMM yyyy');
  }

  // Separate upcoming vs past
  const today = new Date().toISOString().slice(0, 10);
  const upcomingBlocks = blocks.filter(b => b.date >= today);
  const pastBlocks     = blocks.filter(b => b.date <  today);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner /></div>;

  return (
    <div style={{ padding: 28, maxWidth: 680 }}>

      {/* ── Working hours ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Schedule</h1>
        <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 4 }}>Set your working hours for each day of the week</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
        {schedule.map(day => (
          <Card key={day.day_of_week} style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
                <button
                  onClick={() => handleChange(day.day_of_week, 'is_open', !day.is_open)}
                  style={{ width:38, height:22, borderRadius:11, background: day.is_open ? 'var(--p600)' : 'var(--p200)', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}
                >
                  <span style={{ position:'absolute', top:3, left: day.is_open ? 19 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s' }} />
                </button>
                <span style={{ fontSize:14, fontWeight:500, color:'var(--p800)' }}>{DAYS[day.day_of_week]}</span>
              </div>
              {day.is_open ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                  <select value={day.open_time.slice(0,5)} onChange={e => handleChange(day.day_of_week, 'open_time', e.target.value)}
                    style={{ padding:'6px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff', cursor:'pointer' }}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ fontSize:12, color:'var(--p500)' }}>to</span>
                  <select value={day.close_time.slice(0,5)} onChange={e => handleChange(day.day_of_week, 'close_time', e.target.value)}
                    style={{ padding:'6px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff', cursor:'pointer' }}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ fontSize:11, color:'var(--p400)', marginLeft:4 }}>pauza</span>
                  <select value={day.break_start ? day.break_start.slice(0,5) : ''} onChange={e => handleChange(day.day_of_week, 'break_start', e.target.value || null)}
                    style={{ padding:'6px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff', cursor:'pointer' }}>
                    <option value="">—</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ fontSize:12, color:'var(--p500)' }}>–</span>
                  <select value={day.break_end ? day.break_end.slice(0,5) : ''} onChange={e => handleChange(day.day_of_week, 'break_end', e.target.value || null)}
                    style={{ padding:'6px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff', cursor:'pointer' }}>
                    <option value="">—</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span style={{ fontSize:13, color:'var(--p400)', flex:1 }}>Closed</span>
              )}
              <Button size="sm" onClick={() => handleSave(day.day_of_week)} loading={saving === day.day_of_week}
                style={saved === day.day_of_week ? { background:'#2e7d32', color:'#fff' } : {}}>
                {saved === day.day_of_week ? '✓ Saved' : 'Save'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Blocked times ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 500, color: 'var(--p800)' }}>Blocked times</h2>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 2 }}>Days off or time slots when you're unavailable</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(f => !f); setFormError(''); }}>
          {showForm ? 'Cancel' : '+ Add block'}
        </Button>
      </div>

      {/* Add block form */}
      {showForm && (
        <Card style={{ marginBottom: 16, padding: '16px 18px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
            <div style={{ display:'flex', gap: 12, flexWrap:'wrap' }}>
              {/* Date */}
              <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:140 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--p600)' }}>DATE</label>
                <input type="date" value={form.date} min={today}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ padding:'7px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff' }}
                />
              </div>
              {/* Type toggle */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--p600)' }}>TYPE</label>
                <div style={{ display:'flex', border:'1px solid var(--p200)', borderRadius:8, overflow:'hidden' }}>
                  {[{label:'Time slot', val:false},{label:'Full day', val:true}].map(opt => (
                    <button key={String(opt.val)} onClick={() => setForm(f => ({ ...f, is_full_day: opt.val }))}
                      style={{ padding:'7px 14px', fontSize:12, fontWeight:500, border:'none', cursor:'pointer', fontFamily:'inherit',
                        background: form.is_full_day === opt.val ? 'var(--p600)' : 'transparent',
                        color: form.is_full_day === opt.val ? 'var(--p100)' : 'var(--p700)',
                        transition:'all .15s' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time pickers (only for time slot) */}
            {!form.is_full_day && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--p600)' }}>FROM</label>
                  <select value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    style={{ padding:'7px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff', cursor:'pointer' }}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <span style={{ fontSize:12, color:'var(--p500)', marginTop:18 }}>to</span>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--p600)' }}>TO</label>
                  <select value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    style={{ padding:'7px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff', cursor:'pointer' }}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Reason */}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--p600)' }}>REASON (optional)</label>
              <input type="text" placeholder="e.g. Lunch break, Personal day…" value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                style={{ padding:'7px 10px', fontSize:13, border:'1px solid var(--p200)', borderRadius:8, color:'var(--p800)', background:'#fff' }}
              />
            </div>

            {formError && <p style={{ fontSize:12, color:'#dc2626' }}>{formError}</p>}

            <Button onClick={handleAddBlock} loading={formSaving} style={{ alignSelf:'flex-start' }}>
              Save block
            </Button>
          </div>
        </Card>
      )}

      {/* Block list */}
      {blocksLoading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:30 }}><Spinner /></div>
      ) : upcomingBlocks.length === 0 && !showForm ? (
        <p style={{ fontSize:13, color:'var(--p400)', padding:'16px 0' }}>No upcoming blocks.</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {upcomingBlocks.map(b => (
            <Card key={b.id} style={{ padding:'12px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>
                    {formatBlockDate(b.date)}
                    {b.is_full_day
                      ? <span style={{ marginLeft:8, fontSize:11, background:'var(--p200)', color:'var(--p700)', padding:'2px 7px', borderRadius:20 }}>Full day</span>
                      : <span style={{ marginLeft:8, fontSize:12, color:'var(--p600)' }}>{b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}</span>
                    }
                  </div>
                  {b.reason && <div style={{ fontSize:12, color:'var(--p500)', marginTop:2 }}>{b.reason}</div>}
                </div>
                <button onClick={() => handleDeleteBlock(b.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--p400)', fontSize:18, lineHeight:1, padding:4 }}>×</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pastBlocks.length > 0 && (
        <details style={{ marginTop:20 }}>
          <summary style={{ fontSize:12, color:'var(--p400)', cursor:'pointer', userSelect:'none' }}>
            {pastBlocks.length} past block{pastBlocks.length !== 1 ? 's' : ''}
          </summary>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
            {pastBlocks.map(b => (
              <Card key={b.id} style={{ padding:'10px 16px', opacity:0.5 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>
                      {formatBlockDate(b.date)}
                      {b.is_full_day
                        ? <span style={{ marginLeft:8, fontSize:11, background:'var(--p200)', color:'var(--p700)', padding:'2px 7px', borderRadius:20 }}>Full day</span>
                        : <span style={{ marginLeft:8, fontSize:12, color:'var(--p600)' }}>{b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}</span>
                      }
                    </div>
                    {b.reason && <div style={{ fontSize:12, color:'var(--p500)', marginTop:2 }}>{b.reason}</div>}
                  </div>
                  <button onClick={() => handleDeleteBlock(b.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--p400)', fontSize:18, lineHeight:1, padding:4 }}>×</button>
                </div>
              </Card>
            ))}
          </div>
        </details>
      )}

      <p style={{ fontSize:12, color:'var(--p400)', marginTop:24, lineHeight:1.6 }}>
        Blocked times are hidden from clients immediately — they won't see those slots when booking.
      </p>
    </div>
  );
}
