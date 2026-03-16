import { useState } from 'react';
import { createApplication, updateApplication } from '../api';

export default function ApplicationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    company: initial?.company ?? '',
    role: initial?.role ?? '',
    status: initial?.status ?? 'applied',
    url: initial?.url ?? '',
    notes: initial?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (initial?.id) await updateApplication(initial.id, form);
      else await createApplication(form);
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{initial?.id ? 'Edit Application' : 'Add Application'}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} placeholder="Company *" value={form.company} onChange={e => set('company', e.target.value)} required />
          <input style={styles.input} placeholder="Role *" value={form.role} onChange={e => set('role', e.target.value)} required />
          <select style={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          <input style={styles.input} placeholder="Job URL" value={form.url} onChange={e => set('url', e.target.value)} />
          <textarea style={{ ...styles.input, resize: 'vertical', minHeight: '80px' }} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}>{saving ? '...' : initial?.id ? 'Save Changes' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '420px' },
  title: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  input: { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  error: { color: '#f87171', fontSize: '0.82rem', margin: 0 },
  actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' },
  cancelBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#aaa', cursor: 'pointer' },
  saveBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#4f8ef7', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};
