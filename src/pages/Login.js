import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Button, Input } from '../components/UI';

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
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--p50)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src="/logo.png" alt="Snails" style={{ width: 280, height: "auto" }} />
          
        </div>

        <div style={{
          background: 'var(--white)', border: '1px solid var(--p200)',
          borderRadius: 'var(--radius-xl)', padding: 28,
        }}>
          <h1 style={{ fontSize: 17, fontWeight: 500, color: 'var(--p800)', marginBottom: 20 }}>Sign in</h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Email"
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@snails.com"
            />
            <Input
              label="Password"
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && (
              <div style={{ fontSize: 13, color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                {error}
              </div>
            )}
            <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}>
              Sign in
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--p400)', marginTop: 20 }}>
          Snails nail studio · admin portal
        </p>
      </div>
    </div>
  );
}
