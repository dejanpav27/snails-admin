import { useEffect, useRef, useState } from 'react';
import { statusColor } from '../lib/utils';

/* ── Button ─────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', style: styleProp = {}, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
    fontWeight: 500, borderRadius: 'var(--radius-md)', border: 'none',
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    opacity: props.disabled || loading ? 0.6 : 1,
    transition: 'all .18s cubic-bezier(.4,0,.2,1)',
    position: 'relative', overflow: 'hidden',
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  const variants = {
    primary:  { background: 'var(--p600)', color: 'var(--p100)', boxShadow: '0 2px 8px rgba(212,83,126,.25)' },
    outline:  { background: 'transparent', color: 'var(--p700)', border: '1px solid var(--p200)' },
    ghost:    { background: 'transparent', color: 'var(--p700)' },
    danger:   { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
  };
  return (
    <button
      style={{ ...base, ...sizes[size], ...variants[variant], ...styleProp }}
      className={className}
      onMouseEnter={e => {
        if (!props.disabled && !loading && variant === 'primary') {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(212,83,126,.35)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = variants[variant]?.boxShadow || '';
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
      {...props}
    >
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
}

/* ── StatusBadge ─────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const c = statusColor(status);
  const glow = status === 'confirmed'
    ? '0 0 8px rgba(46,125,50,.3)'
    : status === 'pending'
    ? '0 0 8px rgba(245,127,23,.25)'
    : 'none';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 500,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      boxShadow: glow,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0,
        animation: (status === 'confirmed' || status === 'pending') ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }} />
      {status === 'no_show' ? 'No-show' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Card ───────────────────────────────────────────────── */
export function Card({ children, style = {}, className = '', hover = false, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'var(--white)', border: '1px solid var(--p200)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
        transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(114,36,62,.10)' : '0 1px 3px rgba(114,36,62,.04)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────── */
export function Input({ label, error, style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: 11, fontWeight: 600, color: focused ? 'var(--p600)' : 'var(--p700)',
          textTransform: 'uppercase', letterSpacing: '.5px', transition: 'color .15s',
        }}>{label}</label>
      )}
      <input
        style={{
          padding: '9px 13px', fontSize: 13, color: 'var(--p800)',
          background: 'var(--white)',
          border: `1.5px solid ${error ? '#fca5a5' : focused ? 'var(--p500)' : 'var(--p200)'}`,
          borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
          transition: 'border-color .18s, box-shadow .18s',
          boxShadow: focused ? '0 0 0 3px rgba(212,83,126,.1)' : 'none',
          ...style,
        }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────── */
export function Select({ label, error, children, style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: 11, fontWeight: 600, color: focused ? 'var(--p600)' : 'var(--p700)',
          textTransform: 'uppercase', letterSpacing: '.5px', transition: 'color .15s',
        }}>{label}</label>
      )}
      <select
        style={{
          padding: '9px 13px', fontSize: 13, color: 'var(--p800)',
          background: 'var(--white)',
          border: `1.5px solid ${error ? '#fca5a5' : focused ? 'var(--p500)' : 'var(--p200)'}`,
          borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
          transition: 'border-color .18s, box-shadow .18s',
          boxShadow: focused ? '0 0 0 3px rgba(212,83,126,.1)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
    </div>
  );
}

/* ── Textarea ───────────────────────────────────────────── */
export function Textarea({ label, style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{
          fontSize: 11, fontWeight: 600, color: focused ? 'var(--p600)' : 'var(--p700)',
          textTransform: 'uppercase', letterSpacing: '.5px', transition: 'color .15s',
        }}>{label}</label>
      )}
      <textarea
        rows={3}
        style={{
          padding: '9px 13px', fontSize: 13, color: 'var(--p800)',
          background: 'var(--white)',
          border: `1.5px solid ${focused ? 'var(--p500)' : 'var(--p200)'}`,
          borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
          resize: 'vertical', transition: 'border-color .18s, box-shadow .18s',
          boxShadow: focused ? '0 0 0 3px rgba(212,83,126,.1)' : 'none',
          ...style,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 440 }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(114,36,62,.18)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
        animation: 'fadeIn .15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--p200)',
          boxShadow: '0 24px 60px rgba(114,36,62,.18)',
          padding: 26,
          width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
          animation: 'scaleIn .22s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--p800)' }}>{title}</h2>
            <button onClick={onClose} style={{
              background: 'var(--p100)', border: 'none', cursor: 'pointer',
              color: 'var(--p600)', fontSize: 18, lineHeight: 1,
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--p200)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--p100)'}
            >×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────── */
export function Spinner({ size = 20, color = 'var(--p600)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin .75s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity=".15" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
export function Skeleton({ width = '100%', height = 18, style = {}, radius = 'var(--radius-md)' }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Skeleton height={16} width="55%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={13} width={i === rows - 1 ? '35%' : '100%'} />
      ))}
    </Card>
  );
}

/* ── CountUp ─────────────────────────────────────────────── */
export function CountUp({ value, duration = 700, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const end = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (isNaN(end)) { if (ref.current) ref.current.textContent = prefix + value + suffix; return; }
    const startTime = performance.now();
    function update(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = Math.round(end * eased);
      if (ref.current) ref.current.textContent = prefix + current.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, [value, duration, prefix, suffix]);
  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const hue = name ? (name.charCodeAt(0) * 37 + (name.charCodeAt(1) || 0) * 13) % 360 : 300;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `hsl(${hue}, 40%, 88%)`,
      color: `hsl(${hue}, 45%, 32%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0,
      border: `1.5px solid hsl(${hue}, 30%, 80%)`,
    }}>
      {initials}
    </div>
  );
}

/* ── Empty ───────────────────────────────────────────────── */
export function Empty({ icon = '✦', message }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--p400)' }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: .4 }}>{icon}</div>
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────── */
export function StatCard({ label, value, sub, accent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: accent ? 'var(--p600)' : 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        border: `1px solid ${accent ? 'transparent' : 'var(--p200)'}`,
        boxShadow: hovered
          ? accent ? '0 8px 24px rgba(212,83,126,.35)' : '0 8px 24px rgba(114,36,62,.1)'
          : accent ? '0 4px 14px rgba(212,83,126,.2)' : '0 1px 3px rgba(114,36,62,.04)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all .2s ease',
      }}
    >
      <div style={{ fontSize: 11, color: accent ? 'rgba(255,240,245,.7)' : 'var(--p600)', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: accent ? 'var(--p100)' : 'var(--p800)', letterSpacing: '-.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: accent ? 'rgba(255,240,245,.6)' : 'var(--p500)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
