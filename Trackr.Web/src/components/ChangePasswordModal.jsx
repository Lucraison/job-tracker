import { useState } from 'react';
import { changePassword } from '../api';

function parseError(msg) {
  try {
    const obj = JSON.parse(msg);
    if (obj.errors) return Object.values(obj.errors).flat().join(' ');
    if (obj.title) return obj.title;
  } catch {}
  return msg;
}

export default function ChangePasswordModal({ theme, onClose, onSuccess }) {
  const dark = theme === 'dark';
  const card = dark ? '#1a1a1a' : '#fff';
  const border = dark ? '#2a2a2a' : '#e0e0e0';
  const text = dark ? '#fff' : '#111';
  const inputBg = dark ? '#111' : '#f9f9f9';

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await changePassword(current, next);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '380px', color: text }}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Change Password</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            required
            style={{ padding: '0.55rem 0.9rem', borderRadius: '8px', border: `1px solid ${border}`, background: inputBg, color: text, fontSize: '0.9rem' }}
          />
          <input
            type="password"
            placeholder="New password (min. 6 characters)"
            value={next}
            onChange={e => setNext(e.target.value)}
            required
            minLength={6}
            style={{ padding: '0.55rem 0.9rem', borderRadius: '8px', border: `1px solid ${border}`, background: inputBg, color: text, fontSize: '0.9rem' }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{parseError(error)}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: text, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#4f8ef7', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
