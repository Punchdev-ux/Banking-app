import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { accountService } from './account.service';
import { managementService } from './Management.service';

const THEMES = {
  light: {
    pageBg: '#f4f5f7',
    mainBg: '#f8fafc',
    card: '#ffffff',
    cardAlt: '#fafafa',
    rowAlt: '#fcfcfc',
    border: '#e2e8f0',
    borderSoft: '#f1f5f9',
    inputBg: '#ffffff',
    inputBorder: '#cbd5e1',
    headerBg: '#ffffff',
    text: '#0f172a',
    textBody: '#1f2937',
    muted: '#64748b',
    faint: '#94a3b8',
    sidebar: '#0b0f19',
    sidebarBorder: '#1f2937',
    sidebarText: '#9ca3af',
    sidebarActiveBg: '#1e1b4b',
    sidebarActiveText: '#93c5fd',
    accent: '#2563eb',
    accentSoft: '#eff6ff',
    accentText: '#1d4ed8',
    avatar: '#3b82f6',
    brandSub: '#60a5fa',
    green: '#059669',
    red: '#dc2626',
    redSoft: '#fee2e2',
    redBorder: '#fca5a5',
    purple: '#7c3aed',
    btnSoft: '#f1f5f9',
    btnSoftText: '#334155',
    shadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  dark: {
    pageBg: '#000000',
    mainBg: '#000000',
    card: '#0a0a0a',
    cardAlt: '#111111',
    rowAlt: '#0e0e0e',
    border: '#262626',
    borderSoft: '#1a1a1a',
    inputBg: '#111111',
    inputBorder: '#3f3f46',
    headerBg: '#000000',
    text: '#f5f5f5',
    textBody: '#e5e5e5',
    muted: '#a3a3a3',
    faint: '#737373',
    sidebar: '#000000',
    sidebarBorder: '#262626',
    sidebarText: '#a3a3a3',
    sidebarActiveBg: '#3b0a24',
    sidebarActiveText: '#f9a8d4',
    accent: '#ec4899',
    accentSoft: '#3b0a24',
    accentText: '#f9a8d4',
    avatar: '#ec4899',
    brandSub: '#f472b6',
    green: '#34d399',
    red: '#f87171',
    redSoft: '#3f1d1d',
    redBorder: '#7f1d1d',
    purple: '#c084fc',
    btnSoft: '#171717',
    btnSoftText: '#e5e5e5',
    shadow: '0 1px 3px rgba(0,0,0,0.6)',
  },
};

const NAV_ITEMS = [
  { label: 'Ledgers', target: 'register' },
  { label: 'Analytics', target: 'ledgers' },
  { label: 'Transfers', target: 'transfer' },
  { label: 'Financing', target: 'loan' },
];

const isDebit = (type = '') =>
  type.includes('OUT') || type === 'WITHDRAWAL' || type.includes('REJECTED');

const formatMoney = (n) => `R ${Number(n ?? 0).toLocaleString()}`;

const errMsg = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  return fallback;
};

/* ------------------------------------------------------------------ */
/* Management pages (Users & Access, Security Controls, System Settings) */
/* ------------------------------------------------------------------ */

const PAGE_TITLES = {
  dashboard: 'Activity Log & Ledger Management',
  users: 'Users & Access',
  security: 'Security Controls',
  settings: 'System Settings',
};

const MANAGEMENT_ITEMS = [
  { key: 'users', label: 'Users & Access' },
  { key: 'security', label: 'Security Controls' },
  { key: 'settings', label: 'System Settings' },
];

const ROLES = ['ADMIN', 'MANAGER', 'TELLER', 'AUDITOR'];

const apiMessage = (err, fallback) => {
  const res = err?.response;
  if (res?.data?.message) return res.data.message;
  if (res) {
    const hints = {
      401: 'not signed in - check Spring Security',
      403: 'blocked - check Spring Security / CORS',
      404: 'endpoint not found - check package scan and the base URL',
      500: 'server error - check the backend console',
    };
    return `${fallback} (HTTP ${res.status}${hints[res.status] ? `: ${hints[res.status]}` : ''}) at ${res.config?.url ?? ''}`;
  }
  if (err?.request) return 'Cannot reach the server. Check that the backend is running and CORS allows this origin.';
  return fallback;
};

const formatTime = (ts) => (ts ? String(ts).replace('T', ' ').substring(0, 19) : 'Never');

const makeStyles = (t) => ({
  card: { padding: '20px', border: `1px solid ${t.border}`, borderRadius: '8px', backgroundColor: t.card, boxShadow: t.shadow },
  title: { margin: '0 0 16px', fontSize: '15px', color: t.text, borderBottom: `1px solid ${t.borderSoft}`, paddingBottom: '10px' },
  label: { display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px', fontWeight: '500' },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${t.inputBorder}`, outline: 'none', fontSize: '13px', backgroundColor: t.inputBg, color: t.text },
  submit: (bg) => ({ width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }),
  softBtn: { backgroundColor: t.btnSoft, color: t.btnSoftText, border: `1px solid ${t.inputBorder}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  dangerBtn: { backgroundColor: t.redSoft, color: t.red, border: `1px solid ${t.redBorder}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  kpiCard: { padding: '20px', background: t.card, border: `1px solid ${t.border}`, borderRadius: '8px', boxShadow: t.shadow },
  kpiTitle: { margin: '0 0 6px', color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  th: { padding: '12px 20px' },
  td: { padding: '14px 20px' },
  badge: (bg) => ({ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', color: '#ffffff', backgroundColor: bg }),
});

function Notice({ t, notice, onClose }) {
  if (!notice) return null;
  const ok = notice.type === 'success';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', color: ok ? t.accentText : t.red, backgroundColor: ok ? t.accentSoft : t.redSoft, border: `1px solid ${ok ? t.accent : t.redBorder}`, padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', fontWeight: '500', fontSize: '14px' }}>
      <span>{notice.text}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>Dismiss</button>
    </div>
  );
}

function PageIntro({ t, title, subtitle }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: t.text }}>{title}</h2>
      <p style={{ margin: 0, fontSize: '13px', color: t.muted }}>{subtitle}</p>
    </div>
  );
}

function Field({ s, label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ t, label, hint, checked, onChange }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: `1px solid ${t.borderSoft}`, cursor: 'pointer' }}>
      <span>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</span>
        {hint && <span style={{ display: 'block', fontSize: '12px', color: t.muted, marginTop: '2px' }}>{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: t.accent, cursor: 'pointer' }} />
    </label>
  );
}

function TableCard({ t, title, right, children }) {
  return (
    <div style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: t.shadow }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.cardAlt }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: t.text }}>{title}</h3>
        {right}
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

/* ---------------------------- Users & Access ---------------------------- */

function UsersPage({ t}) {
  const s = makeStyles(t);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'TELLER' });
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setUsers(await managementService.getUsers());
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Failed to load users.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const roleColor = { ADMIN: t.purple, MANAGER: t.accent, TELLER: t.green, AUDITOR: '#64748b' };

  const reset = () => {
    setForm({ full_name: '', email: '', role: 'TELLER' });
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { full_name: form.full_name.trim(), email: form.email.trim(), role: form.role };
    if (!payload.full_name || !payload.email) return;
    try {
      if (editingId) {
        await managementService.updateUser(editingId, payload);
      } else {
        await managementService.createUser(payload);
      }
      const wasEditing = Boolean(editingId);
      reset();
      await load();
      setNotice({ type: 'success', text: wasEditing ? 'User updated.' : 'User created.' });
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Could not save the user.') });
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setForm({ full_name: u.full_name, email: u.email, role: u.role });
    setNotice(null);
  };

  const toggleStatus = async (u) => {
    const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await managementService.setUserStatus(u.id, next);
      await load();
      setNotice({ type: 'success', text: `${u.full_name} is now ${next.toLowerCase()}.` });
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Could not change the status.') });
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.full_name} (${u.email})? This cannot be undone.`)) return;
    try {
      await managementService.deleteUser(u.id);
      if (editingId === u.id) reset();
      await load();
      setNotice({ type: 'success', text: `${u.full_name} was removed.` });
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Could not remove the user.') });
    }
  };

  const q = query.trim().toLowerCase();
  const visible = q
    ? users.filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
    : users;
  const active = users.filter((u) => u.status === 'ACTIVE').length;

  if (loading) return <div style={{ color: t.muted, fontSize: '14px' }}>Loading users...</div>;

  return (
    <div>
      <PageIntro t={t} title="Users & Access" subtitle="Manage who can use the console and what role they hold." />
      <Notice t={t} notice={notice} onClose={() => setNotice(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={s.kpiCard}>
          <h4 style={s.kpiTitle}>Total Users</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.accent }}>{users.length}</p>
        </div>
        <div style={s.kpiCard}>
          <h4 style={s.kpiTitle}>Active</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.green }}>{active}</p>
        </div>
        <div style={s.kpiCard}>
          <h4 style={s.kpiTitle}>Suspended</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.red }}>{users.length - active}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <form onSubmit={submit} style={{ ...s.card, flex: '0 0 340px', maxWidth: '100%', border: `1px solid ${editingId ? t.accent : t.border}` }}>
          <h3 style={s.title}>{editingId ? `Edit User #${editingId}` : 'Add New User'}</h3>
          <Field s={s} label="Full Name">
            <input type="text" placeholder="e.g. Jane Smith" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={s.input} />
          </Field>
          <Field s={s} label="Email">
            <input type="email" placeholder="jane@acme.example" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={s.input} />
          </Field>
          <Field s={s} label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={s.input}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <button type="submit" style={s.submit(t.accent)}>{editingId ? 'Save Changes' : 'Create User'}</button>
          {editingId && (
            <button type="button" onClick={reset} style={{ ...s.softBtn, width: '100%', marginTop: '8px', padding: '10px' }}>Cancel</button>
          )}
        </form>

        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <TableCard
            t={t}
            s={s}
            title="Directory"
            right={
              <input
                type="text"
                placeholder="Filter by name, email or role..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ ...s.input, width: '240px', padding: '6px 10px' }}
              />
            }>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: t.cardAlt, borderBottom: `1px solid ${t.border}`, color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={s.th}>ID</th>
                  <th style={s.th}>User</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Last Login</th>
                  <th style={{ ...s.th, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: t.muted }}>
                      {users.length === 0 ? 'No users yet.' : 'No users match your filter.'}
                    </td>
                  </tr>
                ) : (
                  visible.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${t.borderSoft}`, backgroundColor: i % 2 === 0 ? t.card : t.rowAlt }}>
                      <td style={{ ...s.td, fontFamily: 'monospace', color: t.accent, fontWeight: '600' }}><code>#{u.id}</code></td>
                      <td style={s.td}>
                        <div style={{ color: t.text, fontWeight: '600', fontSize: '14px' }}>{u.full_name}</div>
                        <div style={{ color: t.muted, fontSize: '12px' }}>{u.email}</div>
                      </td>
                      <td style={s.td}><span style={s.badge(roleColor[u.role] ?? t.muted)}>{u.role}</span></td>
                      <td style={s.td}><span style={s.badge(u.status === 'ACTIVE' ? '#059669' : '#dc2626')}>{u.status}</span></td>
                      <td style={{ ...s.td, color: t.muted, fontSize: '12px' }}>{formatTime(u.last_login)}</td>
                      <td style={{ ...s.td, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={() => startEdit(u)} style={{ ...s.softBtn, marginRight: '8px' }}>Edit</button>
                        <button onClick={() => toggleStatus(u)} style={{ ...s.softBtn, marginRight: '8px' }}>
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => remove(u)} style={s.dangerBtn}>Remove</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Security Controls --------------------------- */

const SEVERITY_COLORS = { INFO: '#2563eb', WARNING: '#d97706', CRITICAL: '#dc2626' };

function SecurityPage({ t }) {
  const s = makeStyles(t);
  const [policy, setPolicy] = useState(null);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const [p, ev, sum] = await Promise.all([
        managementService.getSecurityPolicy(),
        managementService.getSecurityEvents(50),
        managementService.getSecuritySummary(),
      ]);
      setPolicy(p);
      setEvents(ev);
      setSummary(sum);
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Failed to load security data.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const setNum = (key) => (e) =>
    setPolicy({ ...policy, [key]: e.target.value === '' ? '' : Number(e.target.value) });

  const save = async (e) => {
    e.preventDefault();
    if (policy.ip_allowlist_enabled && !String(policy.ip_allowlist ?? '').trim()) {
      setNotice({ type: 'error', text: 'Add at least one IP address before enabling the allowlist.' });
      return;
    }
    setSaving(true);
    try {
      const saved = await managementService.updateSecurityPolicy(policy);
      setPolicy(saved);
      setEvents(await managementService.getSecurityEvents(50));
      setSummary(await managementService.getSecuritySummary());
      setNotice({ type: 'success', text: 'Security policy saved.' });
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Could not save the policy.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: t.muted, fontSize: '14px' }}>Loading security controls...</div>;
  if (!policy) {
    return (
      <div>
        <PageIntro t={t} title="Security Controls" subtitle="Authentication policy and the security audit trail." />
        <Notice t={t} notice={notice} onClose={() => setNotice(null)} />
      </div>
    );
  }

  return (
    <div>
      <PageIntro t={t} title="Security Controls" subtitle="Authentication policy and the security audit trail." />
      <Notice t={t} notice={notice} onClose={() => setNotice(null)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={s.kpiCard}>
          <h4 style={s.kpiTitle}>Info Events</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.accent }}>{summary?.info_events ?? 0}</p>
        </div>
        <div style={s.kpiCard}>
          <h4 style={s.kpiTitle}>Warnings</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#d97706' }}>{summary?.warning_events ?? 0}</p>
        </div>
        <div style={s.kpiCard}>
          <h4 style={s.kpiTitle}>Critical</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.red }}>{summary?.critical_events ?? 0}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <form onSubmit={save} style={{ ...s.card, flex: '0 0 380px', maxWidth: '100%' }}>
          <h3 style={s.title}>Authentication Policy</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field s={s} label="Min Password Length">
              <input type="number" min="8" max="64" value={policy.min_password_length} onChange={setNum('min_password_length')} style={s.input} />
            </Field>
            <Field s={s} label="Session Timeout (min)">
              <input type="number" min="5" max="480" value={policy.session_timeout_minutes} onChange={setNum('session_timeout_minutes')} style={s.input} />
            </Field>
            <Field s={s} label="Max Failed Logins">
              <input type="number" min="3" max="20" value={policy.max_failed_logins} onChange={setNum('max_failed_logins')} style={s.input} />
            </Field>
            <Field s={s} label="Lockout (min)">
              <input type="number" min="1" max="1440" value={policy.lockout_minutes} onChange={setNum('lockout_minutes')} style={s.input} />
            </Field>
          </div>

          <Toggle t={t} label="Require MFA" hint="Staff must verify with a second factor." checked={policy.require_mfa} onChange={(v) => setPolicy({ ...policy, require_mfa: v })} />
          <Toggle t={t} label="IP allowlist" hint="Only listed addresses may sign in." checked={policy.ip_allowlist_enabled} onChange={(v) => setPolicy({ ...policy, ip_allowlist_enabled: v })} />

          {policy.ip_allowlist_enabled && (
            <div style={{ marginTop: '14px' }}>
              <label style={s.label}>Allowed IPs (comma separated)</label>
              <textarea
                rows={3}
                value={policy.ip_allowlist ?? ''}
                onChange={(e) => setPolicy({ ...policy, ip_allowlist: e.target.value })}
                placeholder="196.25.1.10, 41.76.0.0/16"
                style={{ ...s.input, resize: 'vertical', fontFamily: 'monospace' }}
              />
            </div>
          )}

          <button type="submit" disabled={saving} style={{ ...s.submit(t.accent), marginTop: '18px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Policy'}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: '11px', color: t.faint }}>Last updated: {formatTime(policy.updated_at)}</p>
        </form>

        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <TableCard
            t={t}
            s={s}
            title="Security Audit Trail"
            right={<button onClick={load} style={s.softBtn}>Refresh</button>}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: t.cardAlt, borderBottom: `1px solid ${t.border}`, color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={s.th}>Severity</th>
                  <th style={s.th}>Event</th>
                  <th style={s.th}>Details</th>
                  <th style={s.th}>Actor</th>
                  <th style={s.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: t.muted }}>No security events recorded yet.</td>
                  </tr>
                ) : (
                  events.map((ev, i) => (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${t.borderSoft}`, backgroundColor: i % 2 === 0 ? t.card : t.rowAlt, fontSize: '13px' }}>
                      <td style={s.td}><span style={s.badge(SEVERITY_COLORS[ev.severity] ?? '#64748b')}>{ev.severity}</span></td>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '12px', color: t.text }}>{ev.event_type}</td>
                      <td style={{ ...s.td, color: t.textBody }}>{ev.description}</td>
                      <td style={{ ...s.td, color: t.muted }}>{ev.actor}</td>
                      <td style={{ ...s.td, color: t.muted, fontSize: '12px', whiteSpace: 'nowrap' }}>{formatTime(ev.timestamp)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- System Settings ----------------------------- */

function SettingsPage({ t, dark }) {
  const s = makeStyles(t);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setSettings(await managementService.getSettings());
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Failed to load settings.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(load, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const setText = (key) => (e) => setSettings({ ...settings, [key]: e.target.value });
  const setNum = (key) => (e) => setSettings({ ...settings, [key]: e.target.value === '' ? '' : Number(e.target.value) });

  const save = async (e) => {
    e.preventDefault();
    if (!String(settings.institution_name).trim()) {
      setNotice({ type: 'error', text: 'Institution name is required.' });
      return;
    }
    if (String(settings.currency).trim().length !== 3) {
      setNotice({ type: 'error', text: 'Currency must be a 3-letter code such as ZAR.' });
      return;
    }
    const money = ['daily_transfer_limit', 'max_loan_amount', 'loan_interest_rate'];
    if (money.some((k) => settings[k] === '' || Number(settings[k]) < 0)) {
      setNotice({ type: 'error', text: 'Limits and rates must be zero or more.' });
      return;
    }
    if (Number(settings.loan_interest_rate) > 100) {
      setNotice({ type: 'error', text: 'Interest rate cannot exceed 100%.' });
      return;
    }
    setSaving(true);
    try {
      const saved = await managementService.updateSettings(settings);
      setSettings(saved);
      setNotice({ type: 'success', text: 'System settings saved.' });
    } catch (err) {
      setNotice({ type: 'error', text: apiMessage(err, 'Could not save the settings.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: t.muted, fontSize: '14px' }}>Loading settings...</div>;
  if (!settings) {
    return (
      <div>
        <PageIntro t={t} title="System Settings" subtitle="Institution details, transaction limits and operating mode." />
        <Notice t={t} notice={notice} onClose={() => setNotice(null)} />
      </div>
    );
  }

  return (
    <div>
      <PageIntro t={t} title="System Settings" subtitle="Institution details, transaction limits and operating mode." />
      <Notice t={t} notice={notice} onClose={() => setNotice(null)} />

      {settings.maintenance_mode && (
        <div style={{ color: '#d97706', backgroundColor: dark ? '#2a1d05' : '#fffbeb', border: '1px solid #f59e0b', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', fontWeight: '500', fontSize: '14px' }}>
          Maintenance mode is on. Remember to save to apply it.
        </div>
      )}

      <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div style={s.card}>
          <h3 style={s.title}>Institution</h3>
          <Field s={s} label="Institution Name">
            <input type="text" value={settings.institution_name} onChange={setText('institution_name')} style={s.input} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field s={s} label="Currency (ISO code)">
              <input type="text" maxLength={3} value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })} style={s.input} />
            </Field>
            <Field s={s} label="Timezone">
              <input type="text" value={settings.timezone} onChange={setText('timezone')} style={s.input} />
            </Field>
          </div>
          <Toggle t={t} label="Email notifications" hint="Send alerts for transfers and loan decisions." checked={settings.email_notifications} onChange={(v) => setSettings({ ...settings, email_notifications: v })} />
          <Toggle t={t} label="Maintenance mode" hint="Flags the system as unavailable for customer activity." checked={settings.maintenance_mode} onChange={(v) => setSettings({ ...settings, maintenance_mode: v })} />
        </div>

        <div style={s.card}>
          <h3 style={s.title}>Limits & Rates</h3>
          <Field s={s} label={`Daily Transfer Limit (${settings.currency})`}>
            <input type="number" min="0" step="0.01" value={settings.daily_transfer_limit} onChange={setNum('daily_transfer_limit')} style={s.input} />
          </Field>
          <Field s={s} label={`Maximum Loan Amount (${settings.currency})`}>
            <input type="number" min="0" step="0.01" value={settings.max_loan_amount} onChange={setNum('max_loan_amount')} style={s.input} />
          </Field>
          <Field s={s} label="Loan Interest Rate (% p.a.)">
            <input type="number" min="0" max="100" step="0.01" value={settings.loan_interest_rate} onChange={setNum('loan_interest_rate')} style={s.input} />
          </Field>
          <button type="submit" disabled={saving} style={{ ...s.submit(t.accent), marginTop: '10px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <p style={{ margin: '10px 0 0', fontSize: '11px', color: t.faint }}>Last updated: {formatTime(settings.updated_at)}</p>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [page, setPage] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [selectedAuditAccount, setSelectedAuditAccount] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNav, setActiveNav] = useState('Ledgers');
  const [search, setSearch] = useState('');

  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  const t = dark ? THEMES.dark : THEMES.light;

  useEffect(() => {
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);

  // Registration
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  // Transfer
  const [senderId, setSenderId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  // Loan
  const [loanAccountId, setLoanAccountId] = useState('');
  const [requestedLoanAmount, setRequestedLoanAmount] = useState('');

  const registerRef = useRef(null);
  const ledgersRef = useRef(null);
  const transferRef = useRef(null);
  const loanRef = useRef(null);
  const sectionRefs = {
    register: registerRef,
    ledgers: ledgersRef,
    transfer: transferRef,
    loan: loanRef,
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await accountService.getAccounts();
      const data = Array.isArray(response) ? response : response?.data ?? [];
      setAccounts(data);

      try {
        const analyticsResponse = await accountService.getSystemAnalytics();
        const stats = analyticsResponse?.data ?? analyticsResponse ?? {};
        setAnalytics({
          ...stats,
          accounts_active: data.length,
          transfers_in_count: stats.transfers_in_count ?? stats.transfersInCount ?? 0,
          loans_approved_count: stats.loans_approved_count ?? stats.loansApprovedCount ?? 0,
          loans_rejected_count: stats.loans_rejected_count ?? stats.loansRejectedCount ?? 0,
        });
      } catch {
        setAnalytics(null);
      }
      setError(null);
    } catch {
      setError('Failed to load account data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const goTo = (item) => {
    setActiveNav(item.label);
    const scroll = () => sectionRefs[item.target].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (page !== 'dashboard') {
      setPage('dashboard');
      window.setTimeout(scroll, 80); // wait for the dashboard to mount
    } else {
      scroll();
    }
  };

  const openPage = (key) => {
    setPage(key);
    setActiveNav(null); // clears sidebar + card highlight from the dashboard sections
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewStatement = async (id) => {
    try {
      const historyLogs = await accountService.getTransactionHistory(id);
      setTransactionHistory(Array.isArray(historyLogs) ? historyLogs : historyLogs?.data ?? []);
      setSelectedAuditAccount(id);
    } catch {
      alert('Failed to extract statement entries.');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    const balance = parseFloat(newBalance);
    if (!name || Number.isNaN(balance)) return;
    if (balance < 0) {
      alert('Initial balance cannot be negative.');
      return;
    }

    try {
      await accountService.createAccount({ account_holder_name: name, balance });
      setNewName('');
      setNewBalance('');
      await fetchData();
    } catch (err) {
      const d = err.response?.data;
      const msg = errMsg(d?.account_holder_name, '') || errMsg(d?.balance, '') || 'Failed to create profile';
      alert(`Validation Warning: ${msg}`);
    }
  };

  const handleTransferFunds = async (e) => {
    e.preventDefault();
    const sender = parseInt(senderId, 10);
    const receiver = parseInt(receiverId, 10);
    const amount = parseFloat(transferAmount);
    if (Number.isNaN(sender) || Number.isNaN(receiver) || Number.isNaN(amount)) return;
    if (amount <= 0) {
      alert('Transfer amount must be greater than zero.');
      return;
    }
    if (sender === receiver) {
      alert('Sender and receiver must be different accounts.');
      return;
    }

    try {
      await accountService.transferFunds({
        sender_account_id: sender,
        receiver_account_id: receiver,
        amount,
      });
      setSenderId('');
      setReceiverId('');
      setTransferAmount('');
      await fetchData();
      if (selectedAuditAccount === sender || selectedAuditAccount === receiver) {
        await handleViewStatement(selectedAuditAccount);
      }
      alert('Asset transfer execution completely verified.');
    } catch (err) {
      alert(err.response?.data?.message || 'Transfer error: Insufficient balance pool parameters.');
    }
  };

  const handleApplyForLoan = async (e) => {
    e.preventDefault();
    const accountId = parseInt(loanAccountId, 10);
    const amount = parseFloat(requestedLoanAmount);
    if (Number.isNaN(accountId) || Number.isNaN(amount)) return;
    if (amount <= 0) {
      alert('Loan amount must be greater than zero.');
      return;
    }

    try {
      await accountService.approveNewLoan(accountId, amount);
      setLoanAccountId('');
      setRequestedLoanAmount('');
      await fetchData();
      if (selectedAuditAccount === accountId) {
        await handleViewStatement(accountId);
      }
      alert('Loan Application Approved! Capital has been injected into your checking account.');
    } catch (err) {
      alert(err.response?.data?.message || 'Loan Rejected: Profile failed to satisfy collateral asset criteria.');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently close tracking ledger account #${id}?`)) return;

    try {
      await accountService.deleteAccount(id);
      if (selectedAuditAccount === id) {
        setSelectedAuditAccount(null);
        setTransactionHistory([]);
      }
      await fetchData();
    } catch {
      alert('System restriction: Action could not complete.');
    }
  };

  const nameOf = (acc) => acc?.account_holder_name || acc?.accountHolderName || 'Unnamed Profile';

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => nameOf(a).toLowerCase().includes(q) || String(a.id).includes(q)
    );
  }, [accounts, search]);

  const currentAccount = accounts.find((acc) => acc.id === selectedAuditAccount);
  const totalSystemBalance = accounts.reduce((sum, curr) => sum + (curr.balance || 0), 0);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: dark ? '#000' : '#0b0f19', color: '#f8fafc', fontFamily: 'Inter, sans-serif', fontSize: '16px' }}>
        Initializing Enterprise Dashboard Environment...
      </div>
    );
  }

  // ---- style helpers ----
  const activeTarget = NAV_ITEMS.find((n) => n.label === activeNav)?.target;
  const cardStyle = (key) => ({
    padding: '20px',
    border: `1px solid ${activeTarget === key ? t.accent : t.border}`,
    borderRadius: '8px',
    backgroundColor: t.card,
    boxShadow: activeTarget === key ? `0 0 0 3px ${t.accent}55` : t.shadow,
    transition: 'box-shadow 0.25s, border-color 0.25s',
    scrollMarginTop: '90px',
  });
  const labelStyle = { display: 'block', fontSize: '12px', color: t.muted, marginBottom: '4px', fontWeight: '500' };
  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '6px', border: `1px solid ${t.inputBorder}`, outline: 'none', fontSize: '13px', backgroundColor: t.inputBg, color: t.text };
  const formTitle = { margin: '0 0 16px', fontSize: '15px', color: t.text, borderBottom: `1px solid ${t.borderSoft}`, paddingBottom: '10px' };
  const submitBtn = (bg) => ({ width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: bg, color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px' });
  const kpiCard = { padding: '20px', background: t.card, border: `1px solid ${t.border}`, borderRadius: '8px', boxShadow: t.shadow };
  const kpiTitle = { margin: '0 0 6px', color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ display: 'flex', width: '100%', textAlign: 'left', minHeight: '100vh', backgroundColor: t.pageBg, color: t.textBody, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', transition: 'background 0.25s, color 0.25s' }}>
      {/* Global reset: neutralises Vite starter CSS that squeezes and mis-centers the app */}
      <style>{`
        html, body { margin: 0; padding: 0; width: 100%; min-height: 100vh; display: block; background: ${t.pageBg}; }
        #root { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; text-align: left !important; display: block !important; }
        *, *::before, *::after { box-sizing: border-box; }
        button, input { font-family: inherit; }
        button:hover:not(:disabled) { filter: brightness(0.95); }
        input:focus { border-color: ${t.accent} !important; box-shadow: 0 0 0 3px ${t.accent}33; }
        h3, h4 { text-align: left; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: '240px', backgroundColor: t.sidebar, color: t.sidebarText, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${t.sidebarBorder}`, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 10 }}>
        <div style={{ padding: '20px 24px', fontSize: '20px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '1px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
          ACME <span style={{ fontSize: '11px', color: t.brandSub, fontWeight: 'normal', display: 'block' }}>Core Banking Console</span>
        </div>

        <div style={{ padding: '20px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', padding: '0 12px 8px', letterSpacing: '0.5px' }}>Admin Console</div>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => goTo(item)}
              style={{
                display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: activeNav === item.label ? t.sidebarActiveBg : 'transparent',
                color: activeNav === item.label ? t.sidebarActiveText : t.sidebarText,
                fontWeight: activeNav === item.label ? '600' : 'normal',
                textAlign: 'left', fontSize: '14px', transition: 'background 0.15s',
              }}>
              {item.label}
            </button>
          ))}

          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', padding: '18px 12px 8px', letterSpacing: '0.5px' }}>Management</div>
          {MANAGEMENT_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => openPage(item.key)}
              style={{
                display: 'flex', alignItems: 'center', width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                backgroundColor: page === item.key ? t.sidebarActiveBg : 'transparent',
                color: page === item.key ? t.sidebarActiveText : t.sidebarText,
                fontWeight: page === item.key ? '600' : 'normal',
                textAlign: 'left', fontSize: '14px', transition: 'background 0.15s',
              }}>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.sidebarBorder}`, fontSize: '12px', color: '#6b7280' }}>
          v6.4.2 Enterprise Edition
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: '64px', backgroundColor: t.headerBg, borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: t.textBody }}>{PAGE_TITLES[page]}</span>
            <span style={{ background: t.accentSoft, color: t.accentText, fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px' }}>Live</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="text"
              placeholder={page === 'dashboard' ? 'Search ledgers by name or ID...' : 'Search is for the ledger dashboard'}
              disabled={page !== 'dashboard'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '260px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', outline: 'none', backgroundColor: t.inputBg, color: t.text, boxSizing: 'border-box' }}
            />
            <button
              onClick={() => setDark((d) => !d)}
              aria-label="Toggle day and night mode"
              title={dark ? 'Switch to day mode' : 'Switch to night mode'}
              style={{ background: t.btnSoft, color: t.btnSoftText, border: `1px solid ${t.inputBorder}`, borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              {dark ? 'Day' : 'Night'}
            </button>
            <button style={{ background: t.btnSoft, color: t.btnSoftText, border: `1px solid ${t.inputBorder}`, borderRadius: '6px', padding: '6px 12px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Help</button>
            <div style={{ height: '32px', width: '32px', borderRadius: '50%', backgroundColor: t.avatar, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '13px' }}>N</div>
          </div>
        </header>

        <main style={{ padding: '32px 40px', flex: 1, backgroundColor: t.mainBg, transition: 'background 0.25s', display: 'flex', justifyContent: 'center' }}>
          {/* Full-width content area, centered in the space beside the sidebar */}
          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', textAlign: 'left' }}>
            {page === 'users' && <UsersPage t={t} dark={dark} />}
            {page === 'security' && <SecurityPage t={t} dark={dark} />}
            {page === 'settings' && <SettingsPage t={t} dark={dark} />}

            {page === 'dashboard' && (
            <>
            {error && <div style={{ color: t.red, backgroundColor: t.redSoft, border: `1px solid ${t.redBorder}`, padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', fontWeight: '500' }}>Error: {error}</div>}

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={kpiCard}>
                <h4 style={kpiTitle}>Total Active Ledgers</h4>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.accent }}>{analytics?.totalAccounts ?? accounts.length}</p>
              </div>
              <div style={kpiCard}>
                <h4 style={kpiTitle}>Total Liquid Asset Pool</h4>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: t.green }}>
                  {formatMoney(analytics?.totalSystemBalance ?? totalSystemBalance)}
                </p>
              </div>
              <div style={kpiCard}>
                <h4 style={kpiTitle}>System Status</h4>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: error ? t.red : t.purple, paddingTop: '6px' }}>
                  {error ? 'Degraded (Offline)' : 'Operational (Online)'}
                </p>
              </div>
            </div>

            {/* Action modules */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '35px' }}>
              <form ref={registerRef} onSubmit={handleCreateAccount} style={cardStyle('register')}>
                <h3 style={formTitle}>Register New Client</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Account Holder Name</label>
                  <input type="text" placeholder="e.g. John Doe" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Initial Balance (ZAR)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={submitBtn(t.accent)}>Open Ledger Account</button>
              </form>

              <form ref={transferRef} onSubmit={handleTransferFunds} style={cardStyle('transfer')}>
                <h3 style={formTitle}>Asset Wire Transfer</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Sender ID</label>
                    <input type="number" min="1" placeholder="ID #" value={senderId} onChange={(e) => setSenderId(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Receiver ID</label>
                    <input type="number" min="1" placeholder="ID #" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Transfer Volume (ZAR)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={submitBtn(dark ? '#db2777' : '#059669')}>Execute Wire Sequence</button>
              </form>

              <form ref={loanRef} onSubmit={handleApplyForLoan} style={cardStyle('loan')}>
                <h3 style={formTitle}>Institutional Financing</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Target Account ID</label>
                  <input type="number" min="1" placeholder="ID #" value={loanAccountId} onChange={(e) => setLoanAccountId(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Requested Loan Debt (ZAR)</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={requestedLoanAmount} onChange={(e) => setRequestedLoanAmount(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={submitBtn(dark ? '#a855f7' : '#7c3aed')}>Apply for Capital Loan</button>
              </form>
            </div>

            {/* Ledgers table */}
            <div
              ref={ledgersRef}
              style={{
                backgroundColor: t.card,
                border: `1px solid ${activeTarget === 'ledgers' ? t.accent : t.border}`,
                boxShadow: activeTarget === 'ledgers' ? `0 0 0 3px ${t.accent}55` : t.shadow,
                borderRadius: '8px', overflow: 'hidden', marginBottom: '40px',
                transition: 'box-shadow 0.25s, border-color 0.25s', scrollMarginTop: '90px',
              }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.cardAlt }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: t.text }}>Active Account Ledgers</h3>
                <span style={{ fontSize: '12px', color: t.muted, background: t.card, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${t.border}` }}>
                  Total Records: {filteredAccounts.length}{search && ` of ${accounts.length}`}
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: t.cardAlt, borderBottom: `1px solid ${t.border}`, color: t.muted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 20px' }}>ID</th>
                      <th style={{ padding: '12px 20px' }}>Account Holder Profile</th>
                      <th style={{ padding: '12px 20px' }}>Ledger Balance</th>
                      <th style={{ padding: '12px 20px', textAlign: 'center' }}>Available Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: t.muted }}>
                          {accounts.length === 0 ? 'No active records found in database.' : 'No records match your search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((acc, index) => (
                        <tr key={acc.id} style={{ borderBottom: `1px solid ${t.borderSoft}`, backgroundColor: index % 2 === 0 ? t.card : t.rowAlt }}>
                          <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: t.accent, fontWeight: '600' }}><code>#{acc.id}</code></td>
                          <td style={{ padding: '14px 20px', color: t.text, fontWeight: '600' }}>{nameOf(acc)}</td>
                          <td style={{ padding: '14px 20px', color: t.green, fontWeight: '600' }}>{formatMoney(acc.balance)}</td>
                          <td style={{ padding: '14px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleViewStatement(acc.id)}
                              style={{ marginRight: '8px', backgroundColor: t.btnSoft, color: t.btnSoftText, border: `1px solid ${t.inputBorder}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                              View Statement
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              style={{ backgroundColor: t.redSoft, color: t.red, border: `1px solid ${t.redBorder}`, padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                              Close Account
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit trail */}
            {selectedAuditAccount && (
              <div style={{ padding: '24px', border: `1px solid ${t.inputBorder}`, borderRadius: '8px', backgroundColor: t.card, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${t.border}`, paddingBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: t.text }}>
                    Audit Trail Logs: <span style={{ color: t.accent }}>{currentAccount ? nameOf(currentAccount) : 'Loading...'}</span> (Account #{selectedAuditAccount})
                  </h3>
                  <button
                    onClick={() => { setSelectedAuditAccount(null); setTransactionHistory([]); }}
                    style={{ background: t.btnSoft, color: t.btnSoftText, border: `1px solid ${t.inputBorder}`, padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                    Close Panel
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: t.textBody }}>
                    <thead>
                      <tr style={{ color: t.muted, borderBottom: `1px solid ${t.border}`, fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Amount</th>
                        <th style={{ padding: '10px' }}>Details / Partner</th>
                        <th style={{ padding: '10px' }}>Balance</th>
                        <th style={{ padding: '10px' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: t.muted }}>No audit trail actions recorded yet.</td>
                        </tr>
                      ) : (
                        transactionHistory.map((log) => {
                          const debit = isDebit(log.transaction_type);
                          return (
                            <tr key={log.id} style={{ borderBottom: `1px solid ${t.borderSoft}`, height: '42px', fontSize: '13px' }}>
                              <td style={{ padding: '10px', color: t.muted, fontFamily: 'monospace' }}><code>#{log.id}</code></td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', color: '#ffffff', backgroundColor: debit ? '#dc2626' : '#059669' }}>
                                  {log.transaction_type}
                                </span>
                              </td>
                              <td style={{ padding: '10px', fontWeight: '600', color: debit ? t.red : t.green }}>
                                {debit ? '-' : '+'} {formatMoney(log.amount)}
                              </td>
                              <td style={{ padding: '10px', color: t.muted }}>{log.details}</td>
                              <td style={{ padding: '10px', color: t.faint, fontStyle: 'italic' }}>
                                {log.balance_after != null ? formatMoney(log.balance_after) : '--'}
                              </td>
                              <td style={{ padding: '10px', color: t.muted, fontSize: '12px' }}>
                                {log.timestamp ? String(log.timestamp).replace('T', ' ').substring(0, 19) : 'Recent'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;