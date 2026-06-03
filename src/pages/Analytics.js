import { useState, useEffect, useRef } from 'react';
import { request } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Spinner, Avatar } from '../components/UI';
import { format, parseISO } from 'date-fns';

const getAnalytics = () => request('/analytics');

/* ── Animated bar chart ─────────────────────────────────── */
function BarChart({ data, valueKey, labelKey, color = 'var(--p600)', formatValue = v => v, height = 140 }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); }
    }, { threshold: 0.2 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);

  return (
    <div ref={ref} style={{ display:'flex', alignItems:'flex-end', gap:6, height }}>
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) / max) * 100;
        const val = Number(d[valueKey]);
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
            {val > 0 && (
              <div style={{ fontSize:10, color:'var(--p600)', fontWeight:500, opacity: animated ? 1 : 0, transition:`opacity .3s ease ${i * 0.06 + 0.4}s` }}>
                {formatValue(val)}
              </div>
            )}
            <div style={{
              width:'100%', borderRadius:'6px 6px 0 0',
              background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`,
              height: animated ? `${Math.max(pct, val > 0 ? 3 : 0)}%` : '0%',
              transition: `height .7s cubic-bezier(.4,0,.2,1) ${i * 0.06}s`,
              minHeight: val > 0 ? 4 : 0,
              boxShadow: `0 -2px 8px ${color}40`,
            }} />
            <div style={{ fontSize:10, color:'var(--p500)', whiteSpace:'nowrap', textAlign:'center' }}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Horizontal bar ─────────────────────────────────────── */
function HBar({ label, value, max, color = 'var(--p600)', sub }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div ref={ref} style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>{label}</span>
        <span style={{ fontSize:12, color:'var(--p600)' }}>{sub}</span>
      </div>
      <div style={{ height:8, background:'var(--p100)', borderRadius:99, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:99,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          width: animated ? `${pct}%` : '0%',
          transition: 'width .8s cubic-bezier(.4,0,.2,1)',
          boxShadow: `2px 0 8px ${color}50`,
        }} />
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────── */
function StatCard({ label, value, change, accent, icon }) {
  const [hov, setHov] = useState(false);
  const up = change > 0;
  const down = change < 0;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: accent ? 'linear-gradient(135deg, var(--p700) 0%, var(--p600) 100%)' : 'var(--white)',
        borderRadius: 'var(--radius-lg)', padding:'18px 20px',
        border: `1px solid ${accent ? 'transparent' : 'var(--p200)'}`,
        boxShadow: hov
          ? accent ? '0 10px 30px rgba(212,83,126,.4)' : '0 8px 24px rgba(114,36,62,.1)'
          : accent ? '0 4px 16px rgba(212,83,126,.25)' : '0 1px 4px rgba(114,36,62,.05)',
        transform: hov ? 'translateY(-3px)' : 'none',
        transition: 'all .2s ease',
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ fontSize:11, color: accent ? 'rgba(255,240,245,.65)' : 'var(--p600)', textTransform:'uppercase', letterSpacing:.6, fontWeight:500 }}>{label}</div>
        {icon && <div style={{ fontSize:18, opacity:.7 }}>{icon}</div>}
      </div>
      <div style={{ fontSize:28, fontWeight:600, color: accent ? 'var(--p100)' : 'var(--p800)', letterSpacing:'-.8px', marginBottom: change !== undefined ? 6 : 0 }}>{value}</div>
      {change !== undefined && (
        <div style={{ fontSize:11, fontWeight:500, color: up ? '#4caf50' : down ? '#ef5350' : (accent ? 'rgba(255,240,245,.5)' : 'var(--p400)') }}>
          {up ? '↑' : down ? '↓' : '→'} {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}

/* ── Section card ───────────────────────────────────────── */
function Section({ title, subtitle, children }) {
  return (
    <div style={{
      background:'var(--white)', border:'1px solid var(--p200)',
      borderRadius:'var(--radius-lg)', padding:'20px 22px',
      boxShadow:'0 1px 4px rgba(114,36,62,.04)',
    }}>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:500, color:'var(--p800)' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'var(--p500)', marginTop:2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function pct(a, b) {
  if (!b || b === 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getAnalytics().then(setData).catch(() => setError('Could not load analytics.')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size={32} /></div>;
  if (error)   return <div style={{ padding:28, color:'#dc2626', fontSize:13 }}>{error}</div>;

  const { monthly_revenue, this_month, last_month, weekly_breakdown, top_services, busy_days, top_clients, avg_return_days, client_types } = data;

  const revenueChange  = pct(Number(this_month.revenue),  Number(last_month.revenue));
  const bookingsChange = pct(Number(this_month.bookings), Number(last_month.bookings));
  const avgChange      = pct(Number(this_month.avg_value), Number(last_month.avg_value));

  const totalThisMonth = Number(this_month.bookings) + Number(this_month.cancellations);
  const noShowRate   = totalThisMonth > 0 ? Math.round((this_month.no_shows / totalThisMonth) * 100) : 0;
  const cancelRate   = totalThisMonth > 0 ? Math.round((this_month.cancellations / totalThisMonth) * 100) : 0;
  const returningPct = (Number(client_types.new_clients) + Number(client_types.returning_clients)) > 0
    ? Math.round((Number(client_types.returning_clients) / (Number(client_types.new_clients) + Number(client_types.returning_clients))) * 100)
    : 0;

  // Format weekly labels
  const weeklyData = weekly_breakdown.map((w, i) => ({
    ...w,
    label: `W${i + 1}`,
  }));

  return (
    <div style={{ padding:28, maxWidth:960 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:500, color:'var(--p800)' }}>Analytics</h1>
        <p style={{ fontSize:13, color:'var(--p600)', marginTop:3 }}>Business performance overview</p>
      </div>

      {/* ── Top stats ── */}
      <div className="stagger-list" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <StatCard label="Revenue this month" value={formatPrice(this_month.revenue)} change={revenueChange} accent icon="💰" />
        <StatCard label="Bookings this month" value={this_month.bookings} change={bookingsChange} icon="📅" />
        <StatCard label="Avg booking value" value={formatPrice(Math.round(this_month.avg_value))} change={avgChange} icon="✦" />
        <StatCard label="Returning rate" value={`${returningPct}%`} icon="🔄" />
      </div>

      {/* ── Revenue chart ── */}
      <div style={{ marginBottom:16 }}>
        <Section title="Revenue — last 6 months" subtitle="Confirmed + no-show bookings">
          {monthly_revenue.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--p400)', textAlign:'center', padding:'24px 0' }}>No data yet</p>
          ) : (
            <BarChart
              data={monthly_revenue}
              valueKey="revenue"
              labelKey="month"
              color="var(--p600)"
              formatValue={v => `${(v/1000).toFixed(0)}k`}
              height={160}
            />
          )}
        </Section>
      </div>

      {/* ── Bookings + Weekly ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Section title="Bookings per month" subtitle="Last 6 months">
          <BarChart data={monthly_revenue} valueKey="bookings" labelKey="month" color="var(--p400)" height={130} />
        </Section>
        <Section title="This month by week" subtitle="Revenue breakdown">
          {weeklyData.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--p400)', textAlign:'center', padding:'24px 0' }}>No data yet</p>
          ) : (
            <BarChart data={weeklyData} valueKey="revenue" labelKey="label" color="var(--p300)"
              formatValue={v => `${(v/1000).toFixed(0)}k`} height={130} />
          )}
        </Section>
      </div>

      {/* ── Top services + Busiest days ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Section title="Top services" subtitle="Last 3 months by bookings">
          {top_services.length === 0 ? <p style={{ fontSize:13, color:'var(--p400)' }}>No data yet</p> : (
            top_services.map((s, i) => (
              <HBar
                key={i}
                label={s.name}
                value={Number(s.bookings)}
                max={Number(top_services[0].bookings)}
                color="var(--p600)"
                sub={`${s.bookings} bookings`}
              />
            ))
          )}
        </Section>
        <Section title="Busiest days" subtitle="Last 3 months">
          {busy_days.length === 0 ? <p style={{ fontSize:13, color:'var(--p400)' }}>No data yet</p> : (
            <BarChart data={busy_days} valueKey="bookings" labelKey="day" color="var(--p500)" height={130} />
          )}
        </Section>
      </div>

      {/* ── Top clients ── */}
      <div style={{ marginBottom:16 }}>
        <Section title="Top clients" subtitle="By total spend (all time)">
          {top_clients.length === 0 ? <p style={{ fontSize:13, color:'var(--p400)' }}>No data yet</p> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {top_clients.map((c, i) => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background: i === 0 ? 'var(--p100)' : 'var(--p50)', borderRadius:'var(--radius-md)', border:`1px solid ${i === 0 ? 'var(--p300)' : 'var(--p100)'}`, transition:'all .15s' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--p400)', width:20, textAlign:'center' }}>#{i+1}</div>
                  <Avatar name={c.name} size={34} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--p800)' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'var(--p500)', marginTop:1 }}>{c.visits} visit{c.visits !== '1' ? 's' : ''} · last {format(parseISO(c.last_visit), 'd MMM yyyy')}</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--p700)' }}>{formatPrice(c.total_spend)}</div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Client + retention stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
        <StatCard label="New clients" value={client_types.new_clients} icon="🌱" />
        <StatCard label="Returning clients" value={client_types.returning_clients} icon="⭐" />
        <StatCard label="Avg days between visits" value={avg_return_days ? `${avg_return_days}d` : '—'} icon="📆" />
        <StatCard label="No-show rate" value={`${noShowRate}%`} icon="⚠️" />
      </div>

      {/* ── Cancellation rate ── */}
      <Section title="Booking health" subtitle="This month">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
          {[
            { label:'Completion rate', value:`${Math.max(0, 100 - noShowRate - cancelRate)}%`, color:'var(--p600)', desc:'Bookings that went ahead' },
            { label:'Cancellation rate', value:`${cancelRate}%`, color:'#ef9f27', desc:'Bookings cancelled' },
            { label:'No-show rate', value:`${noShowRate}%`, color:'#e85da0', desc:'Client didn\'t show up' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, fontWeight:600, color:s.color, letterSpacing:'-1px', marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:12, fontWeight:500, color:'var(--p800)', marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:11, color:'var(--p500)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
