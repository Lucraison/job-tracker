import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? '#10b981' : '#ef4444';

  return (
    <div style={{ ...styles.toast, background: bg }}>
      {message}
    </div>
  );
}

const styles = {
  toast: {
    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
    padding: '0.75rem 1.25rem', borderRadius: '10px',
    color: '#fff', fontWeight: 500, fontSize: '0.9rem',
    zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.2s ease',
  },
};
