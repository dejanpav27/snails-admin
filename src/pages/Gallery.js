import { useState, useEffect, useRef } from 'react';
import { request } from '../lib/api';
import { Card, Button, Spinner, Empty } from '../components/UI';

const CLOUD   = 'dl67turkw';
const PRESET  = 'snails';
const CATS    = ['Manicure', 'Pedicure', 'Gel', 'Acrylic', 'Nail art', 'Extras'];

const getGallery   = ()           => request('/gallery');
const addPhoto     = (data)       => request('/gallery', { method: 'POST', body: JSON.stringify(data) });
const deletePhoto  = (id)         => request(`/gallery/${id}`, { method: 'DELETE' });
const getServices  = ()           => request('/services/all');
const setServiceImg = (id, url)   => request(`/gallery/service-image/${id}`, { method: 'PATCH', body: JSON.stringify({ image_url: url }) });

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}

export default function Gallery() {
  const [photos,    setPhotos]    = useState([]);
  const [services,  setServices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [tab,       setTab]       = useState('gallery'); // 'gallery' | 'services'
  const [category,  setCategory]  = useState('');
  const [caption,   setCaption]   = useState('');
  const [svcUploading, setSvcUploading] = useState({});
  const fileRef     = useRef(null);
  const svcFileRefs = useRef({});

  useEffect(() => {
    Promise.all([getGallery(), getServices()])
      .then(([g, s]) => { setPhotos(g); setServices(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const photo = await addPhoto({ image_url: url, category: category || null, caption: caption || null });
      setPhotos(p => [photo, ...p]);
      setCaption(''); setCategory('');
    } catch (err) { alert(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this photo?')) return;
    await deletePhoto(id);
    setPhotos(p => p.filter(x => x.id !== id));
  }

  async function handleServiceImage(svcId, e) {
    const file = e.target.files[0];
    if (!file) return;
    setSvcUploading(u => ({ ...u, [svcId]: true }));
    try {
      const url = await uploadToCloudinary(file);
      await setServiceImg(svcId, url);
      setServices(s => s.map(x => x.id === svcId ? { ...x, image_url: url } : x));
    } catch (err) { alert(err.message); }
    finally { setSvcUploading(u => ({ ...u, [svcId]: false })); e.target.value = ''; }
  }

  async function handleRemoveServiceImage(svcId) {
    await setServiceImg(svcId, null);
    setServices(s => s.map(x => x.id === svcId ? { ...x, image_url: null } : x));
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={32} /></div>;

  return (
    <div style={{ padding:28, maxWidth:860 }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:22, fontWeight:500, color:'var(--p800)' }}>Gallery</h1>
        <p style={{ fontSize:13, color:'var(--p600)', marginTop:3 }}>Manage photos shown on the booking page</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', border:'1px solid var(--p200)', borderRadius:'var(--radius-md)', overflow:'hidden', marginBottom:20, width:'fit-content' }}>
        {[['gallery','Photo gallery'],['services','Service images']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'7px 20px', fontSize:13, fontWeight:500, border:'none',
            cursor:'pointer', fontFamily:'inherit',
            background: tab === t ? 'var(--p600)' : 'transparent',
            color: tab === t ? 'var(--p100)' : 'var(--p700)',
            transition:'all .15s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'gallery' && (
        <>
          {/* Upload form */}
          <Card style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:13, fontWeight:500, color:'var(--p800)', marginBottom:14 }}>Add photo</h3>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--p700)', textTransform:'uppercase', letterSpacing:'.5px' }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding:'8px 12px', fontSize:13, border:'1.5px solid var(--p200)', borderRadius:'var(--radius-md)', color:'var(--p800)', background:'#fff', fontFamily:'inherit' }}>
                  <option value="">No category</option>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, flex:1, minWidth:160 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--p700)', textTransform:'uppercase', letterSpacing:'.5px' }}>Caption (optional)</label>
                <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Pink chrome gel set" style={{ padding:'8px 12px', fontSize:13, border:'1.5px solid var(--p200)', borderRadius:'var(--radius-md)', color:'var(--p800)', background:'#fff', fontFamily:'inherit', outline:'none' }} />
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display:'none' }} />
                <Button onClick={() => fileRef.current.click()} loading={uploading}>
                  {uploading ? 'Uploading…' : '+ Upload photo'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Photo grid */}
          {photos.length === 0 ? (
            <Empty icon="🖼" message="No photos yet — upload your first one above" />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
              {photos.map(p => (
                <div key={p.id} style={{ borderRadius:'var(--radius-lg)', overflow:'hidden', position:'relative', border:'1px solid var(--p200)', background:'#fff' }}>
                  <img src={p.image_url} alt={p.caption || ''} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }} />
                  <div style={{ padding:'8px 10px' }}>
                    {p.category && <div style={{ fontSize:10, fontWeight:600, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.5, marginBottom:2 }}>{p.category}</div>}
                    {p.caption && <div style={{ fontSize:11, color:'var(--p700)' }}>{p.caption}</div>}
                  </div>
                  <button onClick={() => handleDelete(p.id)} style={{
                    position:'absolute', top:6, right:6,
                    background:'rgba(114,36,62,.7)', border:'none', cursor:'pointer',
                    color:'#fff', width:24, height:24, borderRadius:'50%',
                    fontSize:14, display:'flex', alignItems:'center', justifyContent:'center',
                    lineHeight:1,
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'services' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontSize:13, color:'var(--p600)', marginBottom:4 }}>
            Upload an image for each service — it'll show as a faded background on the booking page.
          </p>
          {services.map(svc => (
            <Card key={svc.id} style={{ display:'flex', alignItems:'center', gap:16 }}>
              {/* Preview */}
              <div style={{ width:64, height:64, borderRadius:'var(--radius-md)', overflow:'hidden', border:'1px solid var(--p200)', background:'var(--p100)', flexShrink:0 }}>
                {svc.image_url
                  ? <img src={svc.image_url} alt={svc.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>💅</div>
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--p800)' }}>{svc.name}</div>
                <div style={{ fontSize:11, color:'var(--p500)', marginTop:2 }}>{svc.category} · {svc.duration_mins} min</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input
                  ref={el => svcFileRefs.current[svc.id] = el}
                  type="file" accept="image/*"
                  onChange={e => handleServiceImage(svc.id, e)}
                  style={{ display:'none' }}
                />
                <Button size="sm" variant="outline" loading={svcUploading[svc.id]} onClick={() => svcFileRefs.current[svc.id].click()}>
                  {svc.image_url ? 'Replace' : 'Upload'}
                </Button>
                {svc.image_url && (
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveServiceImage(svc.id)}>Remove</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
