import { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Card, Button, Input, Select, Modal, Spinner, Empty } from '../components/UI';

const CATEGORIES = ['Manicure', 'Pedicure', 'Nail art', 'Extras'];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'add' | service object

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    getServices().then(setServices).catch(console.error).finally(() => setLoading(false));
  }

  async function toggleActive(svc) {
    await updateService(svc.id, { active: !svc.active });
    load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Deactivate this service?')) return;
    await deleteService(id);
    load();
  }

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = services.filter(s => s.category === cat);
    return acc;
  }, {});
  const other = services.filter(s => !CATEGORIES.includes(s.category));
  if (other.length) byCategory['Other'] = other;

  return (
    <div style={{ padding: 28, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Services</h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 2 }}>{services.length} services total</p>
        </div>
        <Button onClick={() => setModal('add')}>+ Add service</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : services.length === 0 ? (
        <Empty message="No services yet" />
      ) : (
        Object.entries(byCategory).map(([cat, svcs]) =>
          svcs.length === 0 ? null : (
            <Card key={cat} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', background: 'var(--p100)', borderBottom: '1px solid var(--p200)', fontSize: 12, fontWeight: 500, color: 'var(--p700)', textTransform: 'uppercase', letterSpacing: .5 }}>
                {cat}
              </div>
              {svcs.map((svc, i) => (
                <div key={svc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px',
                  borderBottom: i < svcs.length - 1 ? '1px solid var(--p100)' : 'none',
                  opacity: svc.active ? 1 : 0.5,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)' }}>{svc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--p500)', marginTop: 2 }}>
                      {svc.duration_mins} min
                      {!svc.active && <span style={{ marginLeft: 8, color: 'var(--gray400)' }}>· inactive</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--p700)', minWidth: 50, textAlign: 'right' }}>
                    {formatPrice(svc.price)}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="sm" variant="outline" onClick={() => setModal(svc)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(svc)}>
                      {svc.active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          )
        )
      )}

      <ServiceModal
        open={!!modal}
        service={modal !== 'add' ? modal : null}
        onClose={() => setModal(null)}
        onSaved={() => { setModal(null); load(); }}
      />
    </div>
  );
}

function ServiceModal({ open, service, onClose, onSaved }) {
  const isEdit = !!service;
  const [form, setForm] = useState({ name: '', category: 'Manicure', duration_mins: 60, price: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (service) setForm({ name: service.name, category: service.category, duration_mins: service.duration_mins, price: service.price });
    else setForm({ name: '', category: 'Manicure', duration_mins: 60, price: '' });
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

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit service' : 'Add service'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Service name *" value={form.name} onChange={set('name')} placeholder="Gel manicure" />
        <Select label="Category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Duration (mins) *" type="number" min={5} value={form.duration_mins} onChange={set('duration_mins')} />
          <Input label="Price (RSD) *" type="number" min={0} step={0.5} value={form.price} onChange={set('price')} placeholder="35.00" />
        </div>
        {error && <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEdit ? 'Save changes' : 'Add service'}</Button>
        </div>
      </form>
    </Modal>
  );
}
