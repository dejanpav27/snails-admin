import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks,
  startOfMonth, endOfMonth, addMonths, subMonths,
  format, isToday, parseISO, isSameMonth, isSunday,
} from 'date-fns';
import { getBookings } from '../lib/api';
import { toDateString, formatTime, formatPrice } from '../lib/utils';
import { Card, Button, Spinner } from '../components/UI';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9); // 9am–5pm

/* ── shared helpers ─────────────────────────────────────── */
function bookingLabel(b) {
  if (b.services && b.services.length > 1) return b.services.map(s => s.name).join(' + ');
  return b.services?.[0]?.name || b.service?.name || '—';
}
function bookingPrice(b) {
  return formatPrice(b.total_price ?? b.service?.price ?? 0);
}

/* ── Week view ──────────────────────────────────────────── */
function WeekView({ anchor, onNavigate, navigate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(anchor,   { weekStartsOn: 1 });
  const days      = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 6);

  useEffect(() => {
    setLoading(true);
    Promise.all(days.map(d => getBookings({ date: toDateString(d) })))
      .then(r => setBookings(r.flat()))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [anchor]); // eslint-disable-line

  function bookingsForHour(day, hour) {
    const ds = toDateString(day);
    return bookings.filter(b =>
      b.booked_at.startsWith(ds) &&
      b.status !== 'cancelled' &&
      parseISO(b.booked_at).getHours() === hour
    ).sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at));
  }

  return (
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
                    fontSize: 12, fontWeight: 500,
                    color: isToday(day) ? 'var(--p800)' : 'var(--p700)',
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
                    const dayBookings = bookingsForHour(day, hour);
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
                              {bookingLabel(b)} · {bookingPrice(b)}
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
  );
}

/* ── Month view ─────────────────────────────────────────── */
function MonthView({ anchor, navigate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null); // date string

  const monthStart = startOfMonth(anchor);
  const monthEnd   = endOfMonth(anchor);

  // grid: full weeks containing the month
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const allDays   = eachDayOfInterval({ start: gridStart, end: gridEnd })
    .filter(d => !isSunday(d)); // Mon–Sat only

  // chunk into weeks (6 days each)
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 6) weeks.push(allDays.slice(i, i + 6));

  // fetch the whole month in one go (day by day in parallel)
  useEffect(() => {
    setLoading(true);
    setSelected(null);
    const daysInGrid = eachDayOfInterval({ start: gridStart, end: gridEnd })
      .filter(d => !isSunday(d));
    Promise.all(daysInGrid.map(d => getBookings({ date: toDateString(d) })))
      .then(r => setBookings(r.flat()))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [anchor]); // eslint-disable-line

  function bookingsForDay(day) {
    const ds = toDateString(day);
    return bookings.filter(b => b.booked_at.startsWith(ds) && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at));
  }

  const selectedBookings = selected
    ? bookings.filter(b => b.booked_at.startsWith(selected) && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at))
    : [];

  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Grid */}
      <Card style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {DAY_LABELS.map(d => (
                  <th key={d} style={{
                    padding: '10px 8px', borderBottom: '1px solid var(--p200)',
                    background: 'var(--p100)', fontSize: 11, fontWeight: 600,
                    color: 'var(--p600)', textAlign: 'center', letterSpacing: '.4px',
                  }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map(day => {
                    const ds        = toDateString(day);
                    const dayB      = bookingsForDay(day);
                    const inMonth   = isSameMonth(day, anchor);
                    const today     = isToday(day);
                    const isSelected = selected === ds;
                    const confirmed = dayB.filter(b => b.status === 'confirmed').length;
                    const pending   = dayB.filter(b => b.status === 'pending').length;

                    return (
                      <td
                        key={ds}
                        onClick={() => inMonth && setSelected(isSelected ? null : ds)}
                        style={{
                          padding: 8, border: '1px solid var(--p100)',
                          verticalAlign: 'top', height: 88,
                          background: isSelected
                            ? 'var(--p200)'
                            : today
                            ? '#fff8fb'
                            : !inMonth
                            ? 'var(--p50, #fff8fb)'
                            : 'white',
                          cursor: inMonth ? 'pointer' : 'default',
                          opacity: inMonth ? 1 : 0.35,
                          transition: 'background .1s',
                        }}
                      >
                        {/* Day number */}
                        <div style={{
                          fontSize: 13, fontWeight: today ? 700 : 400,
                          color: today ? 'var(--p700)' : 'var(--p800)',
                          width: 24, height: 24, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: today ? 'var(--p300)' : 'transparent',
                          marginBottom: 4,
                        }}>
                          {format(day, 'd')}
                        </div>

                        {/* Booking dots / count */}
                        {inMonth && dayB.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {confirmed > 0 && (
                              <div style={{
                                fontSize: 10, fontWeight: 500,
                                color: '#2e7d32', background: '#e8f5e9',
                                borderRadius: 4, padding: '1px 5px',
                                display: 'inline-block',
                              }}>
                                ✓ {confirmed}
                              </div>
                            )}
                            {pending > 0 && (
                              <div style={{
                                fontSize: 10, fontWeight: 500,
                                color: '#f57f17', background: '#fff8e1',
                                borderRadius: 4, padding: '1px 5px',
                                display: 'inline-block',
                              }}>
                                ○ {pending}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Day detail panel */}
      {selected && (
        <Card style={{ width: 260, flexShrink: 0, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p800)' }}>
              {format(new Date(selected + 'T12:00:00'), 'EEE d MMM')}
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p400)', fontSize: 16, lineHeight: 1 }}
            >×</button>
          </div>

          {selectedBookings.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--p400)', textAlign: 'center', padding: '20px 0' }}>No bookings</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedBookings.map(b => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  style={{
                    background: b.status === 'confirmed' ? 'var(--p200)' : 'var(--p100)',
                    border: `1px solid ${b.status === 'confirmed' ? 'var(--p400)' : 'var(--p300)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '7px 10px', cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--p800)' }}>
                    {formatTime(b.booked_at)} — {b.client.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--p600)', marginTop: 2 }}>
                    {bookingLabel(b)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--p500)', marginTop: 1 }}>
                    {bookingPrice(b)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
            onClick={() => navigate('/new')}
          >
            + New booking
          </Button>
        </Card>
      )}
    </div>
  );
}

/* ── Main Calendar page ─────────────────────────────────── */
export default function Calendar() {
  const navigate = useNavigate();
  const [view,   setView]   = useState('week'); // 'week' | 'month'
  const [anchor, setAnchor] = useState(new Date());

  const isWeek = view === 'week';

  function prev()  { setAnchor(a => isWeek ? subWeeks(a, 1)  : subMonths(a, 1)); }
  function next()  { setAnchor(a => isWeek ? addWeeks(a, 1)  : addMonths(a, 1)); }
  function today() { setAnchor(new Date()); }

  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(anchor,   { weekStartsOn: 1 });
  const subtitle  = isWeek
    ? `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`
    : format(anchor, 'MMMM yyyy');

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Calendar</h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 2 }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{
            display: 'flex', border: '1px solid var(--p200)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
          }}>
            {['week', 'month'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 14px', fontSize: 12, fontWeight: 500,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: view === v ? 'var(--p600)' : 'transparent',
                  color: view === v ? 'var(--p100)' : 'var(--p700)',
                  transition: 'all .15s',
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={prev}>← Prev</Button>
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
          <Button variant="outline" size="sm" onClick={next}>Next →</Button>
          <Button size="sm" onClick={() => navigate('/new')}>+ New</Button>
        </div>
      </div>

      {isWeek
        ? <WeekView anchor={anchor} navigate={navigate} />
        : <MonthView anchor={anchor} navigate={navigate} />
      }
    </div>
  );
}
