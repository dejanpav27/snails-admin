import { useState, useEffect } from 'react';
import { request } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Card, Spinner, CountUp } from '../components/UI';

const getAnalytics = () => request('/analytics');

function BarChart({ data, valueKey, labelKey, color = 'var(--p600)' }) {
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10, color: 'var(--p600)', fontWeight: 500 }}>
              {Number(d[valueKey]) > 0 ? Number(d[valueKey]).toLocaleString() : ''}
            </div>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              background: color,
              height: `${Math.max(pct, 2)}%`,
              transition: 'height .6s cubic-bezier(.4,0,.2,1)',
              minHeight: 4,
            }} />
            <div style={{ fontSize: 11, color: 'var(--p500)', whiteSpace: 'nowrap' }}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError('Could not load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>;
  if (error)   return <div style={{ padding: 28, color: '#dc2626', fontSize: 13 }}>{error}</div>;

  const { monthly_revenue, top_services, busy_days, this_month, client_types, no_show_rate } = data;

  const noShowPct = no_show_rate.total > 0
    ? Math.round((no_show_rate.no_shows / no_show_rate.total) * 100)
    : 0;

  const returningPct = (Number(client_types.new_clients) + Number(client_types.returning_clients)) > 0
    ? Math.round((Number(client_types.returning_clients) / (Number(client_types.new_clients) + Number(client_types.returning_clients))) * 100)
    : 0;

  return (
    <div style={{ padding: 28, maxWidth: 900 }} className="stagger-list">

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--p600)', marginTop: 3 }}>Business overview — last 3–6 months</p>
      </div>

      {/* This month stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: "This month's revenue", value: formatPrice(this_month.revenue) },
          { label: 'Bookings this month',  value: this_month.bookings },
          { label: 'Avg booking value',    value: formatPrice(Math.round(this_month.avg_value)) },
          { label: 'No-show rate',         value: `${noShowPct}%` },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--p100)', borderRadius: 'var(--radius-md)',
            padding: '14px 16px', border: '1px solid var(--p200)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--p600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)', marginBottom: 16 }}>Revenue — last 6 months (RSD)</div>
        {monthly_revenue.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--p400)', textAlign: 'center', padding: '24px 0' }}>No data yet</p>
        ) : (
          <BarChart data={monthly_revenue} valueKey="revenue" labelKey="month" color="var(--p600)" />
        )}
      </Card>

      {/* Bookings chart */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)', marginBottom: 16 }}>Bookings per month</div>
        {monthly_revenue.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--p400)', textAlign: 'center', padding: '24px 0' }}>No data yet</p>
        ) : (
          <BarChart data={monthly_revenue} valueKey="bookings" labelKey="month" color="var(--p300)" />
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Top services */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)', marginBottom: 14 }}>Top services (last 3 months)</div>
          {top_services.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--p400)' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top_services.map((s, i) => {
                const maxBookings = Number(top_services[0].bookings);
                const pct = (Number(s.bookings) / maxBookings) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--p800)', fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: 'var(--p600)' }}>{s.bookings} bookings</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--p100)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'var(--p600)', borderRadius: 3,
                        transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Busiest days */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)', marginBottom: 14 }}>Busiest days (last 3 months)</div>
          {busy_days.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--p400)' }}>No data yet</p>
          ) : (
            <BarChart data={busy_days} valueKey="bookings" labelKey="day" color="var(--p400)" />
          )}
        </Card>
      </div>

      {/* Client breakdown */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p800)', marginBottom: 14 }}>Clients this month</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'New clients',       value: client_types.new_clients },
            { label: 'Returning clients', value: client_types.returning_clients },
            { label: 'Returning rate',    value: `${returningPct}%` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--p800)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--p500)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
