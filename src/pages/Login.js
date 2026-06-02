import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Spinner } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [emailFocus, setEmailFocus]   = useState(false);
  const [passFocus,  setPassFocus]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9eef3',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Soft blurred leaf shadows — pure CSS */}
      <div style={{ position:'absolute', top:-60, left:-80, width:320, height:320, borderRadius:'50%', background:'rgba(180,120,140,.07)', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-40, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(180,120,140,.07)', filter:'blur(40px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'30%', right:-100, width:200, height:400, borderRadius:'50%', background:'rgba(180,120,140,.05)', filter:'blur(50px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'20%', left:-80, width:200, height:300, borderRadius:'50%', background:'rgba(180,120,140,.05)', filter:'blur(50px)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom: 8, animation: 'slideUp .4s ease both' }}>
        <img src="/logo.png" alt="Snails — Nails by Sara Pudar" style={{ width: 220, height: 'auto', display: 'block', margin: '0 auto' }} />
      </div>

      {/* Sparkle */}
      <div style={{ fontSize: 14, color: 'var(--p600)', marginBottom: 28, animation: 'slideUp .4s ease both .05s', opacity: .7 }}>✦</div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,.85)',
        backdropFilter: 'blur(12px)',
        borderRadius: 24,
        padding: '40px 44px',
        boxShadow: '0 8px 40px rgba(114,36,62,.1)',
        animation: 'slideUp .4s ease both .08s',
      }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 400, color: 'var(--p800)', marginBottom: 10, letterSpacing: '-.5px' }}>
            Welcome back
          </h1>
          <div style={{ width: 36, height: 2, background: 'var(--p600)', borderRadius: 2, margin: '0 auto 14px' }} />
          <p style={{ fontSize: 14, color: 'var(--p600)', fontWeight: 400 }}>
            Sign in to manage your bookings
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--p800)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Email
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fdf5f8',
              border: `1.5px solid ${emailFocus ? 'var(--p500)' : '#f0dde6'}`,
              borderRadius: 12, padding: '0 14px',
              transition: 'border-color .18s, box-shadow .18s',
              boxShadow: emailFocus ? '0 0 0 3px rgba(212,83,126,.1)' : 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--p400)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input
                type="email" required
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, color: 'var(--p800)', padding: '13px 0',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--p800)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fdf5f8',
              border: `1.5px solid ${passFocus ? 'var(--p500)' : '#f0dde6'}`,
              borderRadius: 12, padding: '0 14px',
              transition: 'border-color .18s, box-shadow .18s',
              boxShadow: passFocus ? '0 0 0 3px rgba(212,83,126,.1)' : 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--p400)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPass ? 'text' : 'password'} required
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 14, color: 'var(--p800)', padding: '13px 0',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--p400)', display: 'flex', alignItems: 'center' }}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontSize: 13, color: '#b91c1c',
              background: '#fee2e2', padding: '10px 14px',
              borderRadius: 10, border: '1px solid #fca5a5',
              animation: 'slideUp .2s ease',
            }}>
              {error}
            </div>
          )}

          {/* Sign in button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? 'var(--p400)' : 'var(--p600)',
              color: '#fff', border: 'none',
              borderRadius: 99, fontSize: 16, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(212,83,126,.35)',
              transition: 'background .18s, transform .1s, box-shadow .18s',
              marginTop: 4, fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--p700)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,83,126,.45)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = loading ? 'var(--p400)' : 'var(--p600)'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,83,126,.35)'; }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = ''; }}
          >
            {loading && <Spinner size={18} color="#fff" />}
            Sign in
          </button>

          {/* Forgot password — non-functional, just visual */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--p600)', marginTop: 2, cursor: 'default' }}>
            Forgot your password?
          </p>
        </form>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 28, animation: 'slideUp .4s ease both .15s' }}>
        <p style={{ fontSize: 13, color: 'var(--p700)', fontWeight: 500 }}>Snails Nail Studio</p>
        <p style={{ fontSize: 13, color: 'var(--p500)', marginTop: 4 }}>✦</p>
      </div>
    </div>
  );
}
