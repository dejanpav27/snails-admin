import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient } from '../lib/api';
import { Card, Avatar, Button, Input, Textarea, Modal, Spinner, Empty } from '../components/UI';

export default function Clients() {
  const navigate = useNavigate();
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getClients(search).then(setClients).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: 28, maxWidth: 860 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Clients</h1>
        <Button onClick={() => setShowAdd(true)}>+ Add client</Button>
      </div>

      <Input
        placeholder="Search by name, email or phone..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 340 }}
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display:'flex',justifyContent:'center',padding:60 }}><Spinner /></div>
        ) : clients.length === 0 ? (
          <Empty message="No clients found" />
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--p100)', borderBottom:'1px solid var(--p200)' }}>
                {['Client','Contact','Visits','Last booking',''].map(h => (
                  <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:500, color:'var(--p600)', textAlign:'left', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ borderBottom:'1px solid var(--p100)', cursor:'pointer', background: i%2===0?'var(--white)':'var(--p50)' }}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background='var(--p100)'}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?'var(--white)':'var(--p50)'}
                >
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      <Avatar name={c.name} size={32} />
                      <span style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:12, color:'var(--p600)' }}>
                    <div>{c.phone || '—'}</div>
                    <div>{c.email || '—'}</div>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ fontSize:12, background:'var(--p100)', color:'var(--p700)', border:'1px solid var(--p200)', borderRadius:'var(--radius-full)', padding:'2px 10px' }}>
                      {c.total_bookings} visits
                    </span>
                  </td>
                  <td style={{ padding:'10px 14px', fontSize:12, color:'var(--p600)' }}>
                    {c.last_booking ? new Date(c.last_booking).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); navigate(`/clients/${c.id}`); }}>View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <AddClientModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
    </div>
  );
}

function AddClientModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', phone:'', email:'', notes:'' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try { await createClient(form); onSaved(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add client">
      <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
        <Input label="Name *"  value={form.name}  onChange={set('name')}  placeholder="Sofia Martins" />
        <Input label="Phone"   value={form.phone} onChange={set('phone')} placeholder="+44 7700 900123" />
        <Input label="Email"   value={form.email} onChange={set('email')} type="email" placeholder="sofia@example.com" />
        <Textarea label="Notes" value={form.notes} onChange={set('notes')} placeholder="Allergies, preferences..." />
        {error && <p style={{ fontSize:13, color:'#dc2626' }}>{error}</p>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save client</Button>
        </div>
      </form>
    </Modal>
  );
}
