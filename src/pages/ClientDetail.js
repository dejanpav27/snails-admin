import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClient, updateClient, request } from '../lib/api';
import { formatDateTime, formatPrice } from '../lib/utils';
import { Card, Button, Input, Textarea, StatusBadge, Spinner } from '../components/UI';

const deleteClient = (id) => request(`/clients/${id}`, { method: 'DELETE' });
const updateAvatar = (id, avatar_url) => request(`/clients/${id}/avatar`, { method: 'PATCH', body: JSON.stringify({ avatar_url }) });

const CLOUD  = 'dl67turkw';
const PRESET = 'snails';

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}

function ClientAvatar({ client, onUploaded }) {
  const fileRef     = useRef(null);
  const [uploading, setUploading] = useState(false);
  const initials = client.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const hue = client.name ? (client.name.charCodeAt(0) * 37 + (client.name.charCodeAt(1) || 0) * 13) % 360 : 300;

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateAvatar(client.id, url);
      onUploaded(url);
    } catch (err) { alert(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function handleRemove() {
    await updateAvatar(client.id, null);
    onUploaded(null);
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Avatar circle */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid var(--p200)',
        background: `hsl(${hue}, 40%, 88%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', position: 'relative',
      }}
        onClick={() => fileRef.current.click()}
        title="Click to upload photo"
      >
        {client.avatar_url ? (
          <img src={client.avatar_url} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 22, fontWeight: 600, color: `hsl(${hue}, 45%, 32%)` }}>{initials}</span>
        )}
        {/* Overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity .15s', borderRadius: '50%',
          fontSize: 18,
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}
        >
          {uploading ? <Spinner size={18} color="#fff" /> : '📷'}
        </div>
      </div>

      {/* Remove button */}
      {client.avatar_url && !uploading && (
        <button onClick={handleRemove} style={{
          position: 'absolute', top: -4, right: -4,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--p600)', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
        }}>×</button>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}

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

  async function handleDelete() {
    if (!window.confirm('Delete this client? This will also delete all their cancelled and no-show bookings.')) return;
    try { await deleteClient(id); navigate('/clients'); }
    catch (err) { alert(err.message || 'Failed to delete client'); }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:80 }}><Spinner /></div>;
  if (!client)  return <div style={{ padding:28,color:'var(--p600)' }}>Client not found.</div>;

  const totalSpend  = (client.bookings||[]).filter(b => b.status !== 'cancelled').reduce((s, b) => s + Number(b.price ?? 0), 0);
  const noShowCount = (client.bookings||[]).filter(b => b.status === 'no_show').length;

  return (
    <div style={{ padding: 28, maxWidth: 760 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
        <button onClick={()=>navigate(-1)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--p600)',fontSize:20 }}>←</button>
        <h1 style={{ fontSize:20,fontWeight:500,color:'var(--p800)' }}>Client profile</h1>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:16 }}>
        <Card style={{ gridColumn:'1 / -1' }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:14 }}>
              <ClientAvatar client={client} onUploaded={url => setClient(c => ({ ...c, avatar_url: url }))} />
              <div>
                <div style={{ fontSize:17,fontWeight:500,color:'var(--p800)' }}>{client.name}</div>
                <div style={{ fontSize:12,color:'var(--p600)',marginTop:2 }}>
                  Client since {new Date(client.created_at).toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
                </div>
                <div style={{ fontSize:11,color:'var(--p400)',marginTop:2 }}>Click photo to change</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <Button size="sm" variant="danger" onClick={handleDelete}>Delete</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>
                {editing ? 'Discard' : 'Edit'}
              </Button>
            </div>
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

        {[
          { label:'Total visits',  value:(client.bookings||[]).filter(b=>b.status!=='cancelled'&&b.status!=='no_show').length },
          { label:'Total spend',   value:formatPrice(totalSpend) },
          { label:'No-shows',      value:noShowCount, warn: noShowCount > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: s.warn ? '#fce7f3' : 'var(--p100)', border:`1px solid ${s.warn ? '#fbcfe8' : 'var(--p200)'}`, borderRadius:'var(--radius-md)', padding:'14px 16px' }}>
            <div style={{ fontSize:11, color: s.warn ? '#9d174d' : 'var(--p600)', textTransform:'uppercase', letterSpacing:.5, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:500, color: s.warn ? '#9d174d' : 'var(--p800)' }}>{s.value}</div>
          </div>
        ))}
      </div>

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
