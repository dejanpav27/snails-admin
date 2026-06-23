import { useState, useEffect, useRef } from 'react';
import { getServices, createService, updateService, deleteService, deleteServicePermanent, request } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Card, Button, Input, Modal, Spinner, Empty } from '../components/UI';

const updateSortOrder = (id, sort_order) =>
  request(`/services/${id}/sort`, { method: 'PATCH', body: JSON.stringify({ sort_order }) });

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const dragItem   = useRef(null);
  const dragOver   = useRef(null);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    getServices().then(setServices).catch(console.error).finally(() => setLoading(false));
  }

  async function toggleActive(svc) {
    await updateService(svc.id, { active: !svc.active });
    load();
  }

  // Drag handlers
  function handleDragStart(e, index) {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '.4';
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    dragOver.current = index;
  }

  async function handleDrop(e) {
    e.preventDefault();
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) return;

    const newServices = [...services];
    const dragged = newServices.splice(dragItem.current, 1)[0];
    newServices.splice(dragOver.current, 0, dragged);

    // Update sort_order for all services
    const updated = newServices.map((s, i) => ({ ...s, sort_order: i }));
    setServices(updated);

    // Save to DB
    try {
      await Promise.all(updated.map(s => updateSortOrder(s.id, s.sort_order)));
    } catch (err) {
      console.error('Sort save failed', err);
    }

    dragItem.current = null;
    dragOver.current = null;
  }

  // Group by category preserving sort order
  const categories = [];
  const byCategory = {};
  services.forEach(s => {
    const cat = s.category || 'Ostalo';
    if (!byCategory[cat]) { byCategory[cat] = []; categories.push(cat); }
    byCategory[cat].push(s);
  });

  const allCategories = [...new Set(services.map(s => s.category || 'Ostalo'))];

  return (
    <div style={{ padding: 28, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Services</h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 2 }}>{services.length} services total</p>
        </div>
        <Button onClick={() => setModal('add')}>+ Add service</Button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--p400)', marginBottom: 20 }}>
        ↕ Drag and drop to reorder — same order shows on the booking page
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : services.length === 0 ? (
        <Empty message="No services yet" />
      ) : (
        categories.map(cat => (
          <Card key={cat} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: 'var(--p100)', borderBottom: '1px solid var(--p200)', fontSize: 12, fontWeight: 500, color: 'var(--p700)', textTransform: 'uppercase', letterSpacing: .5 }}>
              {cat}
            </div>
            {byCategory[cat].map((svc, i) => {
              const globalIndex = services.findIndex(s => s.id === svc.id);
              return (
                <div
                  key={svc.id}
                  draggable
                  onDragStart={e => handleDragStart(e, globalIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => handleDragOver(e, globalIndex)}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px',
                    borderBottom: i < byCategory[cat].length - 1 ? '1px solid var(--p100)' : 'none',
                    opacity: svc.active ? 1 : 0.5,
                    cursor: 'grab',
                    transition: 'background .1s',
                  }}
                  onDragEnter={e => e.currentTarget.style.background = 'var(--p100)'}
                  onDragLeave={e => e.currentTarget.style.background = ''}
                >
                  {/* Drag handle */}
                  <div style={{ color: 'var(--p300)', fontSize: 16, cursor: 'grab', flexShrink: 0, userSelect: 'none' }}>⠿</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)' }}>{svc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--p500)', marginTop: 2 }}>
                      {svc.duration_mins} min
                      {!svc.active && <span style={{ marginLeft: 8, color: 'var(--gray400)' }}>· inactive</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--p700)', minWidth: 80, textAlign: 'right' }}>
                    {formatPrice(svc.price)}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" variant="outline" onClick={() => setModal(svc)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(svc)}>
                      {svc.active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </Card>
        ))
      )}

      <ServiceModal
        open={!!modal}
        service={modal !== 'add' ? modal : null}
        categories={allCategories}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); load(); }}
      />
    </div>
  );
}

function ServiceModal({ open, service, categories = [], onClose, onSaved }) {
  const isEdit = !!service;
  const [form, setForm] = useState({ name: '', category: '', duration_mins: 60, price: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (service) setForm({ name: service.name, category: service.category || '', duration_mins: service.duration_mins, price: service.price });
    else setForm({ name: '', category: '', duration_mins: 60, price: '' });
    setError('');
  }, [service, open]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.price) { setError('Name and price are required'); return; }
    setLoading(true); setError('');
    try {
      if (isEdit) await updateService(service.id, { ...form, duration_mins: Number(form.duration_mins), price: Number(form.price) });
      else        await createService({ ...form, duration_mins: Number(form.duration_mins), price: Number(form.price) });
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Permanently delete this service? This cannot be undone.')) return;
    setLoading(true); setError('');
    try {
      await deleteServicePermanent(service.id);
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit service' : 'Add service'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Service name *" value={form.name} onChange={set('name')} placeholder="GEL (S)" />
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <label style={{ fontSize:11, fontWeight:600, color:'var(--p700)', textTransform:'uppercase', letterSpacing:'.5px' }}>Category</label>
          <input
            list="cat-list"
            value={form.category}
            onChange={set('category')}
            placeholder="Manikir, Nadogradnja..."
            style={{ padding:'9px 13px', fontSize:13, color:'var(--p800)', background:'#fff', border:'1.5px solid var(--p200)', borderRadius:'var(--radius-md)', outline:'none', width:'100%', fontFamily:'inherit' }}
          />
          <datalist id="cat-list">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Duration (mins) *" type="number" min={5} value={form.duration_mins} onChange={set('duration_mins')} />
          <Input label="Price (RSD) *" type="number" min={0} step={1} value={form.price} onChange={set('price')} placeholder="2000" />
        </div>
        {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 4 }}>
          {isEdit && (
            <Button type="button" variant="danger" onClick={handleDelete} loading={loading}>Delete</Button>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{isEdit ? 'Save changes' : 'Add service'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
