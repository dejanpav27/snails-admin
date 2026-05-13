import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, updateBookingStatus } from '../lib/api';
import { formatDateTime, formatPrice } from '../lib/utils';
import { Card, StatusBadge, Button, Avatar, Spinner, Empty, Input, Select } from '../components/UI';

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filters,  setFilters]  = useState({ date: '', status: '' });

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.date)   params.date   = filters.date;
    if (filters.status) params.status = filters.status;
    getBookings(params)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  async function changeStatus(id, status) {
    if (status === 'cancelled' && !window.confirm('Cancel this booking?')) return;
    await updateBookingStatus(id, status);
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x));
  }

  return (
    <div style={{ padding: 28, maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Bookings</h1>
        <Button onClick={() => navigate('/new')}>+ New booking</Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input
          type="date" style={{ width: 160 }}
          value={filters.date}
          onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
        />
        <Select
          style={{ width: 160 }}
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        {(filters.date || filters.status) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({ date: '', status: '' })}>
            Clear filters
          </Button>
        )}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : bookings.length === 0 ? (
          <Empty message="No bookings found" />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--p100)', borderBottom: '1px solid var(--p200)' }}>
                {['Client', 'Service', 'Date & time', 'Price', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--p600)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: .5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr
                  key={b.id}
                  style={{ borderBottom: '1px solid var(--p100)', cursor: 'pointer', background: i % 2 === 0 ? 'var(--white)' : 'var(--p50)' }}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--p100)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--white)' : 'var(--p50)'}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={b.client.name} size={28} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)' }}>{b.client.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--p500)' }}>{b.client.phone || b.client.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--p700)' }}>
                    <div>{b.service.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--p500)' }}>{b.service.duration_mins} min</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--p700)' }}>{formatDateTime(b.booked_at)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: 'var(--p600)' }}>{formatPrice(b.service.price)}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                    {b.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="sm" onClick={() => changeStatus(b.id, 'confirmed')}>Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => changeStatus(b.id, 'cancelled')}>Cancel</Button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <Button size="sm" variant="ghost" onClick={() => changeStatus(b.id, 'cancelled')}>Cancel</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
