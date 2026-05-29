import { statusColor } from '../lib/utils';

/* ── Button ─────────────────────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, className = '', style: styleProp = {}, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
    fontWeight: 500, borderRadius: 'var(--radius-md)', border: 'none',
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    opacity: props.disabled || loading ? 0.6 : 1,
    transition: 'all .15s',
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  const variants = {
    primary:  { background: 'var(--p600)', color: 'var(--p100)' },
    outline:  { background: 'transparent', color: 'var(--p700)', border: '1px solid var(--p200)' },
    ghost:    { background: 'transparent', color: 'var(--p700)' },
    danger:   { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant], ...styleProp }} className={className} {...props}>
      {loading ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
}

/* ── Badge ──────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const c = statusColor(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 500,
      padding: '3px 9px', borderRadius: 'var(--radius-full)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Card ───────────────────────────────────────────────── */
export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: 'var(--white)', border: '1px solid var(--p200)',
      borderRadius: 'var(--radius-lg)', padding: '18px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Input ──────────────────────────────────────────────── */
export function Input({ label, error, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--p700)' }}>{label}</label>}
      <input
        style={{
          padding: '8px 12px', fontSize: 13, color: 'var(--p800)',
          background: 'var(--white)', border: `1px solid ${error ? '#fca5a5' : 'var(--p200)'}`,
          borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
          ...style,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--p400)'}
        onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : 'var(--p200)'}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: '#dc2626' }}>{error}</span>}
    </div>
  );
}

/* ── Select ─────────────────────────────────────────────── */
export function Select({ label, error, children, style = {}, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--p700)' }}>{label}</label>}
      <select
        style={{
          padding: '8px 12px', fontSize: 13, color: 'var(--p800)',
          background: 'var(--white)', border: `1px solid ${error ? '#fca5a5' : 'var(--p200)'}`,
          borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
          ...style,
        }}
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--p700)' }}>{label}</label>}
      <textarea
        rows={3}
        style={{
          padding: '8px 12px', fontSize: 13, color: 'var(--p800)',
          background: 'var(--white)', border: '1px solid var(--p200)',
          borderRadius: 'var(--radius-md)', outline: 'none', width: '100%',
          resize: 'vertical', ...style,
        }}
        {...props}
      />
    </div>
  );
}

/* ── Modal ──────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 440 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(114,36,62,.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--p200)', padding: 24,
          width: '100%', maxWidth: width, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--p800)' }}>{title}</h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--p600)', fontSize: 20, lineHeight: 1, padding: 4,
            }}>×</button>
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
      style={{ animation: 'spin .8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({ name, size = 36 }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--p200)', color: 'var(--p800)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 500, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
export function Empty({ icon = '✦', message }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--p400)' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 13 }}>{message}</p>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────── */
export function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: 'var(--p100)', borderRadius: 'var(--radius-md)',
      padding: '14px 16px', border: '1px solid var(--p200)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--p600)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--p800)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--p600)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
