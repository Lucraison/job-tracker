export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <p style={styles.message}>{message}</p>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '340px' },
  message: { color: '#fff', fontSize: '0.95rem', marginBottom: '1.25rem' },
  actions: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  cancelBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #333', background: 'transparent', color: '#aaa', cursor: 'pointer' },
  confirmBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' },
};
