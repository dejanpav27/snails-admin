import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, updateClient } from '../lib/api';
import { formatDateTime, formatPrice } from '../lib/utils';
import { Card, Avatar, Button, Input, Textarea, StatusBadge, Spinner } from '../components/UI';

export default function ClientDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    getClient(id).then(c => { setClient(c); setForm({ name:c.name, phone:c.phone||'', email:c.email||'', notes:c.notes||'' }); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateClient(id, form);
      setClient(c => ({ ...c, ...updated }));
      setEditing(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner /></div>;
  if (!client)  return <div style={{ padding:28,color:'var(--p600)' }}>Client not found.</div>;

  // FIX: use b.price which now comes from total_price via the API fix
  const totalSpend = (client.bookings||[])
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + Number(b.price ?? 0), 0);

  return (
    <div style={{ padding: 28, maxWidth: 760 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
        <button onClick={()=>navigate(-1)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--p600)',fontSize:20 }}>←</button>
        <h1 style={{ fontSize:20,fontWeight:500,color:'var(--p800)' }}>Client profile</h1>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
        {/* Profile card */}
        <Card style={{ gridColumn:'1 / -1' }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:14 }}>
              <Avatar name={client.name} size={52} />
              <div>
                <div style={{ fontSize:17,fontWeight:500,color:'var(--p800)' }}>{client.name}</div>
                <div style={{ fontSize:12,color:'var(--p600)',marginTop:2 }}>
                  Client since {new Date(client.created_at).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
                </div>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
              {editing ? 'Discard' : 'Edit'}
            </Button>
          </div>

          {editing ? (
            <div style={{ display:'flex',flexDirection:'column',gap:12,marginTop:18 }}>
              <Input label="Name"  value={form.name}  onChange={set('name')} />
              <Input label="Phone" value={form.phone} onChange={set('phone')} />
              <Input label="Email" value={form.email} onChange={set('email')} type="email" />
              <Textarea label="Notes" value={form.notes} onChange={set('notes')} />
              <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" loading={saving} onClick={save}>Save changes</Button>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:18 }}>
              {[['Phone',client.phone||'—'],['Email',client.email||'—'],['Notes',client.notes||'—']].map(([l,v])=>(
                <div key={l} style={{ gridColumn: l==='Notes'?'1/-1':undefined }}>
                  <div style={{ fontSize:11,color:'var(--p500)',marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:13,color:'var(--p800)' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats */}
        {[
          { label:'Total visits',  value:(client.bookings||[]).filter(b=>b.status!=='cancelled').length },
          { label:'Total spend',   value:formatPrice(totalSpend) },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--p100)',border:'1px solid var(--p200)',borderRadius:'var(--radius-md)',padding:'14px 16px' }}>
            <div style={{ fontSize:11,color:'var(--p600)',textTransform:'uppercase',letterSpacing:.5,marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22,fontWeight:500,color:'var(--p800)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Booking history */}
      <Card style={{ padding:0,overflow:'hidden' }}>
        <div style={{ padding:'14px 18px',borderBottom:'1px solid var(--p200)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h3 style={{ fontSize:14,fontWeight:500,color:'var(--p800)' }}>Booking history</h3>
          <Button size="sm" onClick={() => navigate('/new')}>+ New booking</Button>
        </div>
        {(client.bookings||[]).length === 0 ? (
          <div style={{ padding:30,textAlign:'center',color:'var(--p400)',fontSize:13 }}>No bookings yet</div>
        ) : (
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <tbody>
              {(client.bookings||[]).map(b => (
                <tr key={b.id} onClick={() => navigate(`/bookings/${b.id}`)} style={{ borderBottom:'1px solid var(--p100)',cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--p100)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'10px 16px',fontSize:13,color:'var(--p700)' }}>{formatDateTime(b.booked_at)}</td>
                  {/* FIX: service_name now includes all services joined with ' + ' from the API */}
                  <td style={{ padding:'10px 16px',fontSize:13,color:'var(--p800)',fontWeight:500 }}>{b.service_name}</td>
                  <td style={{ padding:'10px 16px',fontSize:13,color:'var(--p600)' }}>{b.duration_mins} min</td>
                  <td style={{ padding:'10px 16px',fontSize:13,fontWeight:500,color:'var(--p600)' }}>{formatPrice(b.price)}</td>
                  <td style={{ padding:'10px 16px' }}><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
