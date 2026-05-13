import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, format, isToday, parseISO } from 'date-fns';
import { getBookings } from '../lib/api';
import { toDateString, formatTime, formatPrice } from '../lib/utils';
import { Card, Button, Spinner } from '../components/UI';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9am–5pm

export default function Calendar() {
  const navigate  = useNavigate();
  const [week, setWeek]       = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const weekStart = startOfWeek(week, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(week, { weekStartsOn: 1 });
  const days      = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5); // Mon–Fri

  useEffect(() => {
    setLoading(true);
    Promise.all(
      days.map(d => getBookings({ date: toDateString(d) }))
    ).then(results => {
      setBookings(results.flat());
    }).catch(console.error).finally(() => setLoading(false));
  }, [week]); // eslint-disable-line

  function bookingsForDay(day) {
    const ds = toDateString(day);
    return bookings
      .filter(b => b.booked_at.startsWith(ds) && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at));
  }

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Calendar</h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 2 }}>
            {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM yyyy')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={() => setWeek(subWeeks(week, 1))}>← Prev</Button>
          <Button variant="outline" size="sm" onClick={() => setWeek(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setWeek(addWeeks(week, 1))}>Next →</Button>
          <Button size="sm" onClick={() => navigate('/new')}>+ New</Button>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ width: 56, padding: '10px 8px', borderBottom: '1px solid var(--p200)', background: 'var(--p100)' }} />
                  {days.map(day => (
                    <th key={day.toString()} style={{
                      padding: '10px 8px', borderBottom: '1px solid var(--p200)',
                      background: isToday(day) ? 'var(--p200)' : 'var(--p100)',
                      fontSize: 12, fontWeight: 500, color: isToday(day) ? 'var(--p800)' : 'var(--p700)',
                      textAlign: 'center',
                    }}>
                      <div>{format(day, 'EEE')}</div>
                      <div style={{ fontSize: 16, fontWeight: isToday(day) ? 600 : 400 }}>{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={hour}>
                    <td style={{
                      padding: '6px 8px', fontSize: 11, color: 'var(--p400)',
                      borderTop: '1px solid var(--p100)', verticalAlign: 'top',
                      textAlign: 'right', paddingRight: 10,
                    }}>
                      {hour}:00
                    </td>
                    {days.map(day => {
                      const dayBookings = bookingsForDay(day).filter(b => {
                        const h = parseISO(b.booked_at).getHours();
                        return h === hour;
                      });
                      return (
                        <td key={day.toString()} style={{
                          padding: 4, borderTop: '1px solid var(--p100)',
                          background: isToday(day) ? '#fff8fb' : 'transparent',
                          verticalAlign: 'top', minHeight: 48,
                        }}>
                          {dayBookings.map(b => (
                            <div
                              key={b.id}
                              onClick={() => navigate(`/bookings/${b.id}`)}
                              style={{
                                background: b.status === 'confirmed' ? 'var(--p200)' : 'var(--p100)',
                                border: `1px solid ${b.status === 'confirmed' ? 'var(--p400)' : 'var(--p300)'}`,
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 7px', marginBottom: 3,
                                cursor: 'pointer', fontSize: 11, color: 'var(--p800)',
                              }}
                            >
                              <div style={{ fontWeight: 500 }}>{formatTime(b.booked_at)} {b.client.name}</div>
                              <div style={{ color: 'var(--p600)', marginTop: 1 }}>
                                {b.service.name} · {formatPrice(b.service.price)}
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
