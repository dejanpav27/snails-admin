import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button, Input, Spinner } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--p50)',
    }}>
      {/* Left decorative panel */}
      <div style={{
        width: '40%',
        background: 'linear-gradient(160deg, var(--p800) 0%, var(--p600) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,.08)', top: -80, right: -80 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,.06)', bottom: 40, left: -60 }} />
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,.05)', top: '40%', right: -40 }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20, animation: 'popIn .6s ease both' }}>✦</div>
          <div style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,240,245,.9)', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Snails
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,240,245,.5)', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Admin Portal
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}>
        <div style={{ width: '100%', maxWidth: 360, animation: 'slideUp .35s ease both .1s' }}>
          <img
            src="/logo.png"
            alt="Snails"
            style={{ width: 200, height: 'auto', display: 'block', marginBottom: 36 }}
          />

          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--p800)', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: 'var(--p600)', marginBottom: 28 }}>
            Sign in to manage your bookings
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email"
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="sara@snails.com"
            />
            <Input
              label="Password"
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && (
              <div style={{
                fontSize: 13, color: '#dc2626',
                background: '#fee2e2', padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fca5a5',
                animation: 'slideUp .2s ease',
              }}>
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}>
              Sign in
            </Button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--p400)', marginTop: 28 }}>
            Snails Nail Studio ✦
          </p>
        </div>
      </div>
    </div>
  );
}
