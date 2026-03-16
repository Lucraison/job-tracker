import { useState } from 'react';
import { login, register } from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) await register(username, password);
      else await login(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Trackr</h1>
        <p style={styles.subtitle}>Job application tracker</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={isRegister ? 6 : undefined}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={{ ...styles.button, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <button style={styles.toggle} onClick={() => setIsRegister(v => !v)}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f' },
  card: { background: '#1a1a1a', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '360px', border: '1px solid #2a2a2a' },
  title: { margin: 0, fontSize: '1.8rem', color: '#fff' },
  subtitle: { color: '#888', marginTop: '4px', marginBottom: '1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '0.95rem' },
  button: { padding: '0.7rem', borderRadius: '8px', border: 'none', background: '#4f8ef7', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' },
  error: { color: '#f87171', fontSize: '0.85rem', margin: 0 },
  toggle: { marginTop: '1rem', background: 'none', border: 'none', color: '#4f8ef7', cursor: 'pointer', fontSize: '0.85rem' },
};
