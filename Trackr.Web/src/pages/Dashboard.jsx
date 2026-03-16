import { useEffect, useState, useCallback } from 'react';
import { getApplications, getStats, deleteApplication, patchStatus, logout, exportCsvUrl, getSavedJobs, createSavedJob, deleteSavedJob } from '../api';
import ApplicationForm from '../components/ApplicationForm';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const STATUS_COLORS = {
  applied: '#4f8ef7',
  interview: '#f59e0b',
  offer: '#10b981',
  rejected: '#ef4444',
};

const COLUMNS = ['company', 'role', 'status', 'appliedAt'];

export default function Dashboard({ onLogout, theme, toggleTheme }) {
  const dark = theme === 'dark';
  const t = makeTheme(dark);

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1, page: 1 });
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('appliedAt');
  const [dir, setDir] = useState('desc');
  const [tab, setTab] = useState('applications');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [savedJobs, setSavedJobs] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [savingJob, setSavingJob] = useState(false);

  function notify(message, type = 'success') { setToast({ message, type }); }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [apps, s] = await Promise.all([
        getApplications({ status: statusFilter, search, sort, dir, page, pageSize: 10 }),
        getStats(),
      ]);
      setData(apps);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, sort, dir, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter, search, sort, dir]);

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try { setSavedJobs(await getSavedJobs()); }
    finally { setLoadingSaved(false); }
  }, []);

  useEffect(() => { if (tab === 'saved') loadSaved(); }, [tab, loadSaved]);

  async function handleSaveJob(e) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setSavingJob(true);
    try {
      await createSavedJob(newUrl.trim(), newNote.trim() || null);
      setNewUrl('');
      setNewNote('');
      loadSaved();
      notify('Job saved');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSavingJob(false);
    }
  }

  async function handleDeleteSaved(id) {
    await deleteSavedJob(id);
    setSavedJobs(j => j.filter(x => x.id !== id));
    notify('Removed', 'error');
  }

  function handleApply(job) {
    setEditing({ url: job.url, _savedJobId: job.id });
    setShowForm(true);
    setTab('applications');
  }

  function handleSort(col) {
    if (sort === col) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(col); setDir('desc'); }
  }

  function sortIcon(col) {
    if (sort !== col) return ' ↕';
    return dir === 'desc' ? ' ↓' : ' ↑';
  }

  async function handleDelete(id) {
    setConfirm({
      message: 'Delete this application? This cannot be undone.',
      onConfirm: async () => {
        setConfirm(null);
        await deleteApplication(id);
        notify('Application deleted', 'error');
        load();
      }
    });
  }

  async function handleStatusChange(id, status) {
    await patchStatus(id, status);
    notify('Status updated');
    load();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(exportCsvUrl(), { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applications.csv';
      a.click();
      URL.revokeObjectURL(url);
      notify('CSV exported');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={t.page}>
      <div style={t.header}>
        <h1 style={t.title}>Trackr</h1>
        <div style={t.headerRight}>
          <button style={t.iconBtn} onClick={toggleTheme}>{dark ? '☀️' : '🌙'}</button>
          <button style={t.secondaryBtn} onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting...' : 'Export CSV'}</button>
          <button style={t.secondaryBtn} onClick={() => setShowChangePassword(true)}>Change Password</button>
          <button style={t.addBtn} onClick={() => { setEditing(null); setShowForm(true); }}>+ Add</button>
          <button style={t.logoutBtn} onClick={() => { logout(); onLogout(); }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['applications', 'saved'].map(tabName => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            style={{
              padding: '0.45rem 1.1rem', borderRadius: '8px', border: `1px solid ${dark ? '#2a2a2a' : '#e0e0e0'}`,
              background: tab === tabName ? '#4f8ef7' : 'transparent',
              color: tab === tabName ? '#fff' : (dark ? '#888' : '#666'),
              fontWeight: tab === tabName ? 600 : 400, cursor: 'pointer', fontSize: '0.9rem', textTransform: 'capitalize'
            }}
          >{tabName}</button>
        ))}
      </div>

      {tab === 'saved' && (
        <div>
          <form onSubmit={handleSaveJob} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <input
              style={{ ...makeTheme(dark).search, flex: 1, minWidth: '220px' }}
              placeholder="Paste job URL..."
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              required
            />
            <input
              style={{ ...makeTheme(dark).search, flex: 1, minWidth: '160px' }}
              placeholder="Note (optional)"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />
            <button
              type="submit"
              disabled={savingJob}
              style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', background: '#4f8ef7', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: savingJob ? 0.7 : 1 }}
            >Save</button>
          </form>

          {loadingSaved ? (
            <p style={{ color: '#888', textAlign: 'center' }}>Loading...</p>
          ) : savedJobs.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', marginTop: '3rem' }}>No saved jobs yet. Paste a URL above to get started.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {savedJobs.map(job => (
                <div key={job.id} style={{ background: dark ? '#1a1a1a' : '#fff', border: `1px solid ${dark ? '#2a2a2a' : '#e0e0e0'}`, borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <a
                    href={job.url.startsWith('http') ? job.url : `https://${job.url}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#4f8ef7', fontSize: '0.9rem', wordBreak: 'break-all', textDecoration: 'none' }}
                  >{job.url}</a>
                  {job.note && <p style={{ margin: 0, color: dark ? '#aaa' : '#555', fontSize: '0.85rem' }}>{job.note}</p>}
                  <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>{new Date(job.savedAt).toLocaleDateString()}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => handleApply(job)}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: '7px', border: 'none', background: '#4f8ef7', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
                    >Apply →</button>
                    <button
                      onClick={() => handleDeleteSaved(job.id)}
                      style={{ padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid #3a1a1a', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem' }}
                    >Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'applications' && stats && (
        <div style={t.stats}>
          {Object.entries(stats).map(([key, val]) => (
            <div
              key={key}
              style={{ ...t.statCard, cursor: key === 'total' ? 'default' : 'pointer', outline: statusFilter === key ? `2px solid ${STATUS_COLORS[key] ?? '#4f8ef7'}` : 'none' }}
              onClick={() => key === 'total' ? setStatusFilter('') : setStatusFilter(f => f === key ? '' : key)}
            >
              <span style={{ ...t.statNum, color: STATUS_COLORS[key] ?? (dark ? '#fff' : '#111') }}>{val}</span>
              <span style={t.statLabel}>{key}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'applications' && <>

      <div style={t.toolbar}>
        <input style={t.search} placeholder="Search company or role..." value={search} onChange={e => setSearch(e.target.value)} />
        {statusFilter && (
          <button style={t.clearFilter} onClick={() => setStatusFilter('')}>
            {statusFilter} ✕
          </button>
        )}
      </div>

      <table style={t.table}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th key={col} style={{ ...t.th, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort(col)}>
                {col === 'appliedAt' ? 'Applied' : col.charAt(0).toUpperCase() + col.slice(1)}{sortIcon(col)}
              </th>
            ))}
            <th style={t.th}>Notes</th>
            <th style={t.th}>Link</th>
            <th style={t.th}></th>
          </tr>
        </thead>
        <tbody style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.15s' }}>
          {data.items.map(app => (
            <tr key={app.id} style={t.tr}>
              <td style={t.td}>{app.company}</td>
              <td style={t.td}>{app.role}</td>
              <td style={t.td}>
                <select
                  style={{ ...t.badge, background: STATUS_COLORS[app.status] + '22', color: STATUS_COLORS[app.status], border: 'none', cursor: 'pointer' }}
                  value={app.status}
                  onChange={e => handleStatusChange(app.id, e.target.value)}
                >
                  {['applied', 'interview', 'offer', 'rejected'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td style={t.td}>{new Date(app.appliedAt).toLocaleDateString()}</td>
              <td style={{ ...t.td, color: dark ? '#888' : '#666', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.notes ?? '—'}</td>
              <td style={t.td}>
                {app.url ? <a href={app.url.startsWith('http') ? app.url : `https://${app.url}`} target="_blank" rel="noreferrer" style={t.link}>View</a> : <span style={{ color: '#444' }}>—</span>}
              </td>
              <td style={t.td}>
                <button style={t.editBtn} onClick={() => { setEditing(app); setShowForm(true); }}>Edit</button>
                <button style={t.deleteBtn} onClick={() => handleDelete(app.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {data.items.length === 0 && (
            <tr><td colSpan={7} style={{ ...t.td, textAlign: 'center', color: '#555', padding: '2rem' }}>
              {search || statusFilter ? 'No applications match your filters.' : 'No applications yet. Add one!'}
            </td></tr>
          )}
        </tbody>
      </table>

      {data.totalPages > 1 && (
        <div style={t.pagination}>
          <button style={t.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>Page {page} of {data.totalPages}</span>
          <button style={t.pageBtn} disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
      </>}

      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showForm && (
        <ApplicationForm
          initial={editing}
          theme={theme}
          onSave={async () => { setShowForm(false); if (editing?._savedJobId) { await deleteSavedJob(editing._savedJobId).catch(() => {}); } setEditing(null); notify(editing?.id ? 'Application updated' : 'Application added'); load(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal
          theme={theme}
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => { setShowChangePassword(false); notify('Password updated'); }}
        />
      )}
    </div>
  );
}

function makeTheme(dark) {
  const bg = dark ? '#0f0f0f' : '#f5f5f5';
  const card = dark ? '#1a1a1a' : '#fff';
  const border = dark ? '#2a2a2a' : '#e0e0e0';
  const text = dark ? '#fff' : '#111';
  const muted = dark ? '#888' : '#666';
  const inputBg = dark ? '#111' : '#f9f9f9';

  return {
    page: { minHeight: '100vh', background: bg, color: text, padding: '2rem', fontFamily: 'system-ui, sans-serif', transition: 'background 0.2s, color 0.2s' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    title: { margin: 0, fontSize: '1.5rem', color: text },
    headerRight: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
    iconBtn: { padding: '0.4rem 0.6rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', fontSize: '1rem' },
    addBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#4f8ef7', color: '#fff', fontWeight: 600, cursor: 'pointer' },
    secondaryBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer', fontSize: '0.85rem' },
    logoutBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer' },
    stats: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    statCard: { background: card, border: `1px solid ${border}`, borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px', transition: 'outline 0.1s' },
    statNum: { fontSize: '1.8rem', fontWeight: 700 },
    statLabel: { fontSize: '0.75rem', color: muted, textTransform: 'capitalize', marginTop: '2px' },
    toolbar: { display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' },
    search: { padding: '0.55rem 0.9rem', borderRadius: '8px', border: `1px solid ${border}`, background: inputBg, color: text, fontSize: '0.9rem', width: '280px' },
    clearFilter: { padding: '0.45rem 0.9rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer', fontSize: '0.82rem' },
    table: { width: '100%', borderCollapse: 'collapse', background: card, borderRadius: '10px', overflow: 'hidden' },
    th: { textAlign: 'left', padding: '0.75rem 1rem', color: muted, fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: `1px solid ${border}` },
    tr: { borderBottom: `1px solid ${dark ? '#1f1f1f' : '#f0f0f0'}` },
    td: { padding: '0.75rem 1rem', fontSize: '0.9rem', color: text },
    badge: { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 },
    link: { color: '#4f8ef7', fontSize: '0.85rem' },
    editBtn: { marginRight: '0.5rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer', fontSize: '0.8rem' },
    deleteBtn: { padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #3a1a1a', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' },
    pagination: { display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', marginTop: '1.25rem' },
    pageBtn: { padding: '0.4rem 0.9rem', borderRadius: '8px', border: `1px solid ${border}`, background: 'transparent', color: muted, cursor: 'pointer', fontSize: '0.85rem' },
  };
}
