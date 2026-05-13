import { useState, useEffect } from 'react';
import { Card, Button, Spinner } from '../components/UI';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
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

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(null);
  const [saved,    setSaved]    = useState(null);

  useEffect(() => {
    fetchSchedule().then(setSchedule).catch(console.error).finally(() => setLoading(false));
  }, []);

  function handleChange(dayOfWeek, field, value) {
    setSchedule(s => s.map(d => d.day_of_week === dayOfWeek ? { ...d, [field]: value } : d));
  }

  async function handleSave(dayOfWeek) {
    const day = schedule.find(d => d.day_of_week === dayOfWeek);
    setSaving(dayOfWeek);
    try {
      const result = await updateDay(dayOfWeek, { is_open: day.is_open, open_time: day.open_time, close_time: day.close_time });
      setSchedule(s => s.map(d => d.day_of_week === dayOfWeek ? result : d));
      setSaved(dayOfWeek);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner /></div>;

  return (
    <div style={{ padding: 28, maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Schedule</h1>
        <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 4 }}>Set your working hours for each day of the week</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      <p style={{ fontSize:12, color:'var(--p400)', marginTop:16, lineHeight:1.6 }}>
        Changes take effect immediately — clients won't see slots outside these hours.
      </p>
    </div>
  );
}
