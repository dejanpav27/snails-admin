import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, updateBookingStatus, getNotifications, markAllNotificationsRead, request } from '../lib/api';
import { formatTime, formatDate, formatDateTime, formatPrice, toDateString } from '../lib/utils';
import { Card, StatusBadge, Button, Avatar, Spinner, Empty, CountUp } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { addDays, format, isToday, isTomorrow, parseISO } from 'date-fns';

const getWeekStats = () => request('/analytics');

export default function Dashboard() {
  const { admin } = useAuth();
  const navigate  = useNavigate();
  const today     = toDateString(new Date());

  const [bookings,       setBookings]       = useState([]);
  const [pendingAll,     setPendingAll]     = useState([]);
  const [upcoming,       setUpcoming]       = useState([]);
  const [weekStats,      setWeekStats]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingUpcoming,setLoadingUpcoming]= useState(true);
  const [notifications,  setNotifications]  = useState([]);
  const [unread,         setUnread]         = useState(0);
  const [bellOpen,       setBellOpen]       = useState(false);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleBellOpen() {
    setBellOpen(o => !o);
    if (!bellOpen && unread > 0) {
      try { await markAllNotificationsRead(); setUnread(0); setNotifications(n => n.map(x => ({ ...x, read: true }))); } catch {}
    }
  }

  // Today's bookings
  useEffect(() => {
    getBookings({ date: today })
      .then(setBookings).catch(console.error).finally(() => setLoading(false));
  }, [today]);

  // All pending
  useEffect(() => {
    getBookings({ status: 'pending' })
      .then(setPendingAll).catch(console.error).finally(() => setLoadingPending(false));
  }, []);

  // Next 7 days upcoming confirmed
  useEffect(() => {
    const days = Array.from({ length: 7 }, (_, i) => toDateString(addDays(new Date(), i + 1)));
    Promise.all(days.map(d => getBookings({ date: d, status: 'confirmed' })))
      .then(results => {
        const all = results.flat().sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at));
        setUpcoming(all.slice(0, 8));
      })
      .catch(console.error)
      .finally(() => setLoadingUpcoming(false));
  }, []);

  // Week stats
  useEffect(() => {
    getWeekStats().then(setWeekStats).catch(() => {});
  }, []);

  async function confirm(id) {
    await updateBookingStatus(id, 'confirmed');
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'confirmed' } : x));
    setPendingAll(b => b.filter(x => x.id !== id));
  }

  async function cancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await updateBookingStatus(id, 'cancelled');
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'cancelled' } : x));
    setPendingAll(b => b.filter(x => x.id !== id));
  }

  const active    = bookings.filter(b => b.status !== 'cancelled');
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const revenue   = active.reduce((s, b) => s + Number(b.total_price ?? b.service?.price ?? 0), 0);
  const monthRevenue = weekStats ? Number(weekStats.this_month.revenue) : 0;
  const monthBookings = weekStats ? Number(weekStats.this_month.bookings) : 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  function dayLabel(dateStr) {
    const d = parseISO(dateStr);
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE d MMM');
  }

  // Group upcoming by date
  const upcomingByDay = upcoming.reduce((acc, b) => {
    const ds = toDateString(parseISO(b.booked_at));
    if (!acc[ds]) acc[ds] = [];
    acc[ds].push(b);
    return acc;
  }, {});

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:500, color:'var(--p800)' }}>
            {greeting}{admin?.name ? `, ${admin.name.split(' ')[0]}` : ''} ✦
          </h1>
          <p style={{ fontSize:13, color:'var(--p600)', marginTop:3 }}>{formatDate(new Date().toISOString())}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Bell */}
          <div ref={bellRef} style={{ position:'relative' }}>
            <button onClick={handleBellOpen} style={{ width:36, height:36, background:'var(--p100)', border:'1px solid var(--p200)', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--p200)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--p100)'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d4537e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, background:'#d4537e', color:'#fff', fontSize:9, fontWeight:600, width:15, height:15, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <div style={{ position:'absolute', top:'110%', right:0, width:300, maxHeight:400, overflowY:'auto', background:'#fff', border:'1px solid var(--p200)', borderRadius:12, boxShadow:'0 8px 24px rgba(114,36,62,.12)', zIndex:999 }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--p100)' }}>
                  <span style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>Notifications</span>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding:'24px 14px', textAlign:'center', fontSize:13, color:'var(--p400)' }}>No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n.id} onClick={() => { navigate(`/bookings/${n.booking_id}`); setBellOpen(false); }}
                    style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--p100)', background: n.read ? '#fff' : '#fff8fb' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--p100)'}
                    onMouseLeave={e => e.currentTarget.style.background=n.read?'#fff':'#fff8fb'}
                  >
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:n.read?400:500, color:'var(--p800)' }}>
                          {n.type==='new_booking' ? `New booking — ${n.client_name}` : n.type==='confirmed' ? `Confirmed — ${n.client_name}` : `Cancelled — ${n.client_name}`}
                        </div>
                        {n.service_label && <div style={{ fontSize:11, color:'var(--p600)', marginTop:1 }}>{n.service_label}</div>}
                        {n.booked_at && <div style={{ fontSize:11, color:'var(--p400)', marginTop:1 }}>{formatDateTime(n.booked_at)}</div>}
                      </div>
                      {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--p600)', marginTop:4, flexShrink:0 }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => navigate('/new')}>+ New booking</Button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="stagger-list" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {/* Today */}
        <div style={{ background:'linear-gradient(135deg, var(--p700) 0%, var(--p600) 100%)', borderRadius:'var(--radius-lg)', padding:'16px 18px', boxShadow:'0 4px 16px rgba(212,83,126,.25)', transition:'transform .2s, box-shadow .2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(212,83,126,.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(212,83,126,.25)'; }}
        >
          <div style={{ fontSize:11, color:'rgba(255,240,245,.65)', textTransform:'uppercase', letterSpacing:.6, marginBottom:6, fontWeight:500 }}>Today's bookings</div>
          <div style={{ fontSize:30, fontWeight:600, color:'var(--p100)', letterSpacing:'-.8px' }}><CountUp value={active.length} /></div>
          <div style={{ fontSize:11, color:'rgba(255,240,245,.55)', marginTop:4 }}>{confirmed.length} confirmed · {pendingAll.length} pending</div>
        </div>

        {/* Today revenue */}
        <div style={{ background:'var(--white)', border:'1px solid var(--p200)', borderRadius:'var(--radius-lg)', padding:'16px 18px', transition:'transform .2s, box-shadow .2s', boxShadow:'0 1px 4px rgba(114,36,62,.05)' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(114,36,62,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(114,36,62,.05)'; }}
        >
          <div style={{ fontSize:11, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.6, marginBottom:6, fontWeight:500 }}>Today's revenue</div>
          <div style={{ fontSize:22, fontWeight:600, color:'var(--p800)', letterSpacing:'-.5px' }}>{formatPrice(revenue)}</div>
          <div style={{ fontSize:11, color:'var(--p500)', marginTop:4 }}>from {active.length} appointment{active.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Month revenue */}
        <div style={{ background:'var(--white)', border:'1px solid var(--p200)', borderRadius:'var(--radius-lg)', padding:'16px 18px', transition:'transform .2s, box-shadow .2s', boxShadow:'0 1px 4px rgba(114,36,62,.05)' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(114,36,62,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(114,36,62,.05)'; }}
        >
          <div style={{ fontSize:11, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.6, marginBottom:6, fontWeight:500 }}>This month</div>
          <div style={{ fontSize:22, fontWeight:600, color:'var(--p800)', letterSpacing:'-.5px' }}>{weekStats ? formatPrice(monthRevenue) : '—'}</div>
          <div style={{ fontSize:11, color:'var(--p500)', marginTop:4 }}>{monthBookings} booking{monthBookings !== 1 ? 's' : ''} total</div>
        </div>

        {/* Upcoming */}
        <div style={{ background:'var(--white)', border:'1px solid var(--p200)', borderRadius:'var(--radius-lg)', padding:'16px 18px', transition:'transform .2s, box-shadow .2s', boxShadow:'0 1px 4px rgba(114,36,62,.05)' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(114,36,62,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 4px rgba(114,36,62,.05)'; }}
        >
          <div style={{ fontSize:11, color:'var(--p600)', textTransform:'uppercase', letterSpacing:.6, marginBottom:6, fontWeight:500 }}>Next 7 days</div>
          <div style={{ fontSize:30, fontWeight:600, color:'var(--p800)', letterSpacing:'-.8px' }}><CountUp value={upcoming.length} /></div>
          <div style={{ fontSize:11, color:'var(--p500)', marginTop:4 }}>confirmed appointments</div>
        </div>
      </div>

      {/* ── Pending requests ── */}
      {!loadingPending && pendingAll.length > 0 && (
        <Card style={{ marginBottom:20, border:'1px solid #ffb3d1' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h2 style={{ fontSize:15, fontWeight:500, color:'var(--p800)' }}>Pending requests</h2>
              <span style={{ background:'#d4537e', color:'#fff', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:99 }}>{pendingAll.length}</span>
            </div>
            <button onClick={() => navigate('/bookings')} style={{ fontSize:12, color:'var(--p600)', background:'none', border:'none', cursor:'pointer' }}>View all →</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pendingAll.sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at)).map(booking => (
              <PendingRow key={booking.id} booking={booking} onConfirm={confirm} onCancel={cancel} />
            ))}
          </div>
        </Card>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* ── Today's schedule ── */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:500, color:'var(--p800)' }}>Today's schedule</h2>
            <button onClick={() => navigate('/bookings')} style={{ fontSize:12, color:'var(--p600)', background:'none', border:'none', cursor:'pointer' }}>View all →</button>
          </div>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:32 }}><Spinner /></div>
          ) : confirmed.length === 0 ? (
            <Empty message="No confirmed appointments today" />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {confirmed.sort((a, b) => new Date(a.booked_at) - new Date(b.booked_at)).map(booking => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </Card>

        {/* ── Upcoming 7 days ── */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:500, color:'var(--p800)' }}>Coming up</h2>
            <button onClick={() => navigate('/calendar')} style={{ fontSize:12, color:'var(--p600)', background:'none', border:'none', cursor:'pointer' }}>Calendar →</button>
          </div>
          {loadingUpcoming ? (
            <div style={{ display:'flex', justifyContent:'center', padding:32 }}><Spinner /></div>
          ) : upcoming.length === 0 ? (
            <Empty message="No upcoming appointments" />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {Object.entries(upcomingByDay).map(([ds, dayBookings]) => (
                <div key={ds}>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--p500)', textTransform:'uppercase', letterSpacing:.6, marginBottom:6 }}>
                    {dayLabel(ds + 'T12:00:00')}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {dayBookings.map(booking => (
                      <BookingRow key={booking.id} booking={booking} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function PendingRow({ booking, onConfirm, onCancel }) {
  const navigate = useNavigate();
  const serviceLabel = booking.services?.length > 1 ? booking.services.map(s => s.name).join(' + ') : booking.services?.[0]?.name || booking.service?.name || '—';
  const duration = booking.total_duration_mins ?? booking.service?.duration_mins ?? 0;
  const price    = booking.total_price ?? booking.service?.price ?? 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#fff8fb', borderRadius:'var(--radius-md)', border:'1px solid #ffb3d1' }}>
      <Avatar name={booking.client.name} size={32} />
      <div style={{ flex:1, cursor:'pointer' }} onClick={() => navigate(`/bookings/${booking.id}`)}>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>{booking.client.name}</div>
        <div style={{ fontSize:11, color:'var(--p600)' }}>{serviceLabel} · {duration} min · {formatPrice(price)}</div>
        <div style={{ fontSize:11, color:'var(--p400)', marginTop:2 }}>{formatDateTime(booking.booked_at)}</div>
      </div>
      <div style={{ display:'flex', gap:6 }}>
        <Button size="sm" onClick={() => onConfirm(booking.id)}>Confirm</Button>
        <Button size="sm" variant="ghost" onClick={() => onCancel(booking.id)}>Cancel</Button>
      </div>
    </div>
  );
}

function BookingRow({ booking, compact }) {
  const navigate = useNavigate();
  const serviceLabel = booking.services?.length > 1 ? booking.services.map(s => s.name).join(' + ') : booking.services?.[0]?.name || booking.service?.name || '—';
  const duration = booking.total_duration_mins ?? booking.service?.duration_mins ?? 0;
  const price    = booking.total_price ?? booking.service?.price ?? 0;
  return (
    <div onClick={() => navigate(`/bookings/${booking.id}`)} style={{
      display:'flex', alignItems:'center', gap:10,
      padding: compact ? '8px 10px' : '10px 12px',
      background:'var(--p100)', borderRadius:'var(--radius-md)',
      border:'1px solid var(--p200)', cursor:'pointer',
      transition:'border-color .15s, background .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--p400)'; e.currentTarget.style.background='var(--p200)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--p200)'; e.currentTarget.style.background='var(--p100)'; }}
    >
      <div style={{ fontSize:12, fontWeight:500, color:'var(--p700)', minWidth:36 }}>{formatTime(booking.booked_at)}</div>
      <Avatar name={booking.client.name} size={compact ? 26 : 30} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:500, color:'var(--p800)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{booking.client.name}</div>
        <div style={{ fontSize:11, color:'var(--p600)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{serviceLabel} · {formatPrice(price)}</div>
      </div>
    </div>
  );
}
