/* ═══════════════════════════════════════════════════════════
   PIU Commencement 2026 — Admin Dashboard Logic
   Full CRUD backed by the Neon database (via /api/guests),
   with CSV/JSON import + export.
   ═══════════════════════════════════════════════════════════ */

const API_URL  = '/api/guests';
/* Invitation page lives at the site root, regardless of whether the admin
   is opened at /admin, /admin.html, or a sub-path. */
const BASE_URL = window.location.origin + '/index.html';
const TOKEN_KEY = 'piu_admin_token';

let guests        = [];
let currentFilter = 'all';
let searchQuery   = '';
let editingId     = null;
let adminToken    = sessionStorage.getItem(TOKEN_KEY) || '';

/* ══════════════════════════════════════
   API HELPER
   Adds the admin token; if the server rejects it (401),
   prompts for one, stores it, and retries once.
══════════════════════════════════════ */
async function api(path, { method = 'GET', body } = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminToken) headers['x-admin-token'] = adminToken;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && retry) {
    const t = prompt('Enter admin token to make changes:');
    if (t) {
      adminToken = t.trim();
      sessionStorage.setItem(TOKEN_KEY, adminToken);
      return api(path, { method, body }, false);
    }
  }
  return res;
}

const sameId = (a, b) => String(a) === String(b);

/* ══════════════════════════════════════
   LOAD
══════════════════════════════════════ */
let loadError = null;

async function loadGuests() {
  loadError = null;
  try {
    const res = await api(API_URL);
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { const j = await res.json(); if (j && j.error) detail = j.error; } catch {}
      throw new Error(detail);
    }
    guests = await res.json();
  } catch (err) {
    guests = [];
    loadError = err.message || 'Network error';
    showToast('Could not load guests: ' + loadError, 'error');
  }
  render();
}

/* ══════════════════════════════════════
   CRUD OPERATIONS
══════════════════════════════════════ */
async function addGuest() {
  const nameInput = document.getElementById('nameInput');
  const roleInput = document.getElementById('roleInput');
  const companyInput = document.getElementById('companyInput');
  const name = nameInput.value.trim();
  const role = roleInput.value.trim();
  const company = companyInput ? companyInput.value.trim() : '';

  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = 'var(--danger)';
    setTimeout(() => nameInput.style.borderColor = '', 1500);
    return;
  }

  // Local duplicate check for instant feedback (server enforces it too).
  if (guests.some(g => g.name.toLowerCase() === name.toLowerCase())) {
    showToast(`"${name}" is already in the guest list`, 'error');
    return;
  }

  try {
    const res = await api(API_URL, { method: 'POST', body: { name, role, company } });
    if (res.status === 409) {
      showToast(`"${name}" is already in the guest list`, 'error');
      return;
    }
    if (!res.ok) throw new Error('create failed');
    guests.push(await res.json());

    nameInput.value = '';
    roleInput.value = '';
    if (companyInput) companyInput.value = '';
    nameInput.focus();
    render();
    showToast(`${name} added to guest list`, 'success');
  } catch {
    showToast('Failed to add guest', 'error');
  }
}

function removeGuest(id) {
  const guest = guests.find(g => sameId(g.id, id));
  if (!guest) return;

  showConfirm(
    `Remove ${guest.name}?`,
    'This action cannot be undone.',
    async () => {
      try {
        const res = await api(`${API_URL}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('delete failed');
        guests = guests.filter(g => !sameId(g.id, id));
        render();
        showToast(`${guest.name} removed`, 'info');
      } catch {
        showToast('Failed to remove guest', 'error');
      }
    }
  );
}

function editGuest(id) {
  const guest = guests.find(g => sameId(g.id, id));
  if (!guest) return;

  editingId = guest.id;
  document.getElementById('editNameInput').value = guest.name;
  document.getElementById('editRoleInput').value = guest.role || '';
  const editCompany = document.getElementById('editCompanyInput');
  if (editCompany) editCompany.value = guest.company || '';
  document.getElementById('editModal').classList.add('show');
}

async function saveEdit() {
  const name = document.getElementById('editNameInput').value.trim();
  const role = document.getElementById('editRoleInput').value.trim();
  const editCompany = document.getElementById('editCompanyInput');
  const company = editCompany ? editCompany.value.trim() : '';

  if (!name) {
    document.getElementById('editNameInput').focus();
    return;
  }

  try {
    const res = await api(`${API_URL}?id=${encodeURIComponent(editingId)}`, {
      method: 'PATCH',
      body: { name, role, company }
    });
    if (res.status === 409) {
      showToast('Another guest already has that name', 'error');
      return;
    }
    if (!res.ok) throw new Error('update failed');
    const updated = await res.json();
    const i = guests.findIndex(g => sameId(g.id, editingId));
    if (i > -1) guests[i] = updated;
    render();
    showToast('Guest updated', 'success');
    closeEditModal();
  } catch {
    showToast('Failed to update guest', 'error');
  }
}

function closeEditModal() {
  editingId = null;
  document.getElementById('editModal').classList.remove('show');
}

async function cycleStatus(id) {
  const guest = guests.find(g => sameId(g.id, id));
  if (!guest) return;

  const cycle = ['pending', 'confirmed', 'declined'];
  const next = cycle[(cycle.indexOf(guest.status) + 1) % cycle.length];

  try {
    const res = await api(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { status: next }
    });
    if (!res.ok) throw new Error('status failed');
    guest.status = next;
    render();
  } catch {
    showToast('Failed to update status', 'error');
  }
}

/* ══════════════════════════════════════
   LINK GENERATION
══════════════════════════════════════ */
function buildLink(name, role, company, urlCode) {
  // Short, clean link:  https://host/123456
  if (urlCode) return window.location.origin + '/' + urlCode;

  // Fallback (no code yet): long link with details in the query string.
  const p = new URLSearchParams();
  p.set('name', name);
  if (role) p.set('role', role);
  if (company) p.set('company', company);
  return BASE_URL + '?' + p.toString();
}

function copyLink(id) {
  const guest = guests.find(g => sameId(g.id, id));
  if (!guest) return;

  const link = buildLink(guest.name, guest.role, guest.company, guest.urlCode);
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.querySelector(`[data-copy-id="${id}"]`);
    if (btn) {
      btn.classList.add('copied');
      const original = btn.getAttribute('data-tooltip');
      btn.setAttribute('data-tooltip', 'Copied!');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('data-tooltip', original);
      }, 2000);
    }
    showToast('Link copied to clipboard', 'success');
  }).catch(() => {
    prompt('Copy this invitation link:', link);
  });
}

function previewLink(id) {
  const guest = guests.find(g => sameId(g.id, id));
  if (!guest) return;
  window.open(buildLink(guest.name, guest.role, guest.company, guest.urlCode), '_blank');
}

function copyAllLinks() {
  if (!guests.length) {
    showToast('No guests to copy links for', 'error');
    return;
  }
  const filtered = getFilteredGuests();
  const lines = filtered.map(g => `${g.name}\t${buildLink(g.name, g.role, g.company, g.urlCode)}`).join('\n');
  navigator.clipboard.writeText(lines).then(() => {
    showToast(`${filtered.length} links copied`, 'success');
  }).catch(() => {
    showToast('Failed to copy links', 'error');
  });
}

/* ══════════════════════════════════════
   SHARE (native OS share sheet)
   Hands the link to the device/browser's own share UI so the person
   picks Telegram, Messenger, WhatsApp, Mail, AirDrop, etc. themselves —
   whatever is installed. We deliberately share the URL by itself
   (no extra caption glued to it): most chat apps only auto-unfurl a
   link preview/thumbnail when the message is *just* the URL — once
   other text shares the line with it, several clients (Messenger
   included) skip the preview and show a plain text line instead.
══════════════════════════════════════ */
async function shareLink(id) {
  const guest = guests.find(g => sameId(g.id, id));
  if (!guest) return;

  const link = buildLink(guest.name, guest.role, guest.company, guest.urlCode);

  if (navigator.share) {
    try {
      await navigator.share({ url: link });
    } catch (err) {
      if (err && err.name === 'AbortError') return;   // user closed the share sheet
      fallbackCopy(link);
    }
    return;
  }

  // Browser has no native share support (e.g. desktop Firefox) — copy instead.
  fallbackCopy(link);
}

function fallbackCopy(link) {
  navigator.clipboard.writeText(link).then(() => {
    showToast('Sharing isn\'t supported here — link copied instead', 'info');
  }).catch(() => {
    prompt('Copy this invitation link:', link);
  });
}

/* ══════════════════════════════════════
   SEARCH & FILTER
══════════════════════════════════════ */
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  render();
}

function onSearch(e) {
  searchQuery = e.target.value.trim().toLowerCase();
  render();
}

function getFilteredGuests() {
  return guests.filter(g => {
    const matchesFilter = currentFilter === 'all' || g.status === currentFilter;
    const matchesSearch = !searchQuery ||
      g.name.toLowerCase().includes(searchQuery) ||
      (g.role && g.role.toLowerCase().includes(searchQuery)) ||
      (g.company && g.company.toLowerCase().includes(searchQuery)) ||
      (g.urlCode && String(g.urlCode).includes(searchQuery));
    return matchesFilter && matchesSearch;
  });
}

/* ══════════════════════════════════════
   EXPORT
══════════════════════════════════════ */
function exportCSV() {
  if (!guests.length) {
    showToast('No guests to export', 'error');
    return;
  }

  const header = 'Name,Position,Company,Code,RSVP Status,Link';
  const rows = guests.map(g => {
    const link = buildLink(g.name, g.role, g.company, g.urlCode);
    return `"${g.name}","${g.role || ''}","${g.company || ''}","${g.urlCode || ''}","${g.status}","${link}"`;
  });

  downloadFile(header + '\n' + rows.join('\n'),
    `PIU_Commencement_2026_Guests_${new Date().toISOString().slice(0,10)}.csv`,
    'text/csv;charset=utf-8;');
  showToast('CSV exported successfully', 'success');
}

function exportJSON() {
  if (!guests.length) {
    showToast('No guests to export', 'error');
    return;
  }
  downloadFile(JSON.stringify(guests, null, 2),
    `PIU_Commencement_2026_Guests_${new Date().toISOString().slice(0,10)}.json`,
    'application/json');
  showToast('JSON backup exported', 'success');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════
   IMPORT (writes through the API)
══════════════════════════════════════ */
async function importGuests(records) {
  let count = 0;
  for (const r of records) {
    const name = (r.name || '').trim();
    if (!name) continue;
    if (guests.some(g => g.name.toLowerCase() === name.toLowerCase())) continue;
    try {
      const res = await api(API_URL, {
        method: 'POST',
        body: {
          name,
          role: r.role || '',
          company: r.company || '',
          status: ['pending', 'confirmed', 'declined'].includes(r.status) ? r.status : 'pending'
        }
      });
      if (res.ok) {
        guests.push(await res.json());
        count++;
      }
    } catch { /* skip failures */ }
  }
  render();
  showToast(`${count} guest${count === 1 ? '' : 's'} imported`, 'success');
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  if (file.name.endsWith('.json')) {
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        importGuests(imported);
      } catch {
        showToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
  } else if (file.name.endsWith('.csv')) {
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split('\n').filter(l => l.trim());
        const records = [];
        for (let i = 1; i < lines.length; i++) {   // skip header
          const parts = parseCSVLine(lines[i]);
          records.push({
            name: parts[0]?.trim(),
            role: parts[1]?.trim() || '',
            company: parts[2]?.trim() || '',
            status: parts[4]?.trim() || 'pending'
          });
        }
        importGuests(records);
      } catch {
        showToast('Invalid CSV file', 'error');
      }
    };
    reader.readAsText(file);
  } else {
    showToast('Please use a .csv or .json file', 'error');
  }

  e.target.value = '';   // reset input
}

/** Parse a single CSV line, handling quoted fields. */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/* ══════════════════════════════════════
   RENDERING
══════════════════════════════════════ */
function render() {
  renderStats();
  renderTable();
}

function renderStats() {
  document.getElementById('statTotal').textContent     = guests.length;
  document.getElementById('statConfirmed').textContent = guests.filter(g => g.status === 'confirmed').length;
  document.getElementById('statPending').textContent   = guests.filter(g => g.status === 'pending').length;
  document.getElementById('statDeclined').textContent  = guests.filter(g => g.status === 'declined').length;
}

function renderTable() {
  const wrap = document.getElementById('tableWrap');
  const filtered = getFilteredGuests();

  if (loadError) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" style="background:var(--danger-bg);">
          <svg viewBox="0 0 24 24" style="stroke:var(--danger);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p class="empty-state-title">Couldn't reach the database</p>
        <p class="empty-state-desc">${esc(loadError)}.<br>
        Make sure you opened this via the server (http://localhost:3000/admin.html, not the file directly),
        that <code>DATABASE_URL</code> is set, and that the <code>guests</code> table exists
        (run <code>schema.sql</code> + <code>migrations/001</code> in Neon).</p>
      </div>`;
    return;
  }

  if (!filtered.length) {
    const msg = guests.length
      ? 'No guests match your current filter.'
      : 'No guests yet — add a name above to get started.';
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p class="empty-state-title">${msg}</p>
        <p class="empty-state-desc">${guests.length ? 'Try adjusting your search or filter.' : 'Each guest gets a unique personalized invitation link.'}</p>
      </div>`;
    return;
  }

  const rows = filtered.map(g => `
    <tr>
      <td>
        <div class="guest-name-cell">${esc(g.name)}</div>
        ${g.role ? `<div class="guest-role-cell">${esc(g.role)}</div>` : ''}
        ${g.company ? `<div class="guest-role-cell">${esc(g.company)}</div>` : ''}
        ${g.urlCode ? `<div class="guest-code-cell">#${esc(g.urlCode)}</div>` : ''}
      </td>
      <td>
        <button class="status-badge ${g.status}" onclick="cycleStatus('${g.id}')" title="Click to change status">
          ${g.status}
        </button>
      </td>
      <td>
        <div class="action-group">
          <button class="btn-action copy" data-copy-id="${g.id}" data-tooltip="Copy link" onclick="copyLink('${g.id}')">
            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button class="btn-action preview" data-tooltip="Preview" onclick="previewLink('${g.id}')">
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </button>
          <button class="btn-action share" data-tooltip="Share" onclick="shareLink('${g.id}')">
            <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button class="btn-action edit" data-tooltip="Edit" onclick="editGuest('${g.id}')">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action delete" data-tooltip="Remove" onclick="removeGuest('${g.id}')">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <table class="guest-table">
      <thead>
        <tr>
          <th>Guest</th>
          <th>RSVP</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/* ══════════════════════════════════════
   AUTH GUARD
   On Vercel, /admin is served by a plain static rewrite (no
   server-side check runs — see vercel.json). So this page must
   verify the session itself, client-side, before rendering.
══════════════════════════════════════ */
async function guardAuth() {
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) {
      window.location.replace('/login');
      return false;
    }
    return true;
  } catch {
    // If the check itself fails (network error), fail closed.
    window.location.replace('/login');
    return false;
  }
}

/* ══════════════════════════════════════
   LOGOUT
══════════════════════════════════════ */
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch { /* ignore network errors — still send them to /login */ }
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.href = '/login';
}

/* ══════════════════════════════════════
   UI HELPERS
══════════════════════════════════════ */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-text">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

let confirmCallback = null;

function showConfirm(title, subtext, onConfirm) {
  confirmCallback = onConfirm;
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmSubtext').textContent = subtext;
  document.getElementById('confirmOverlay').classList.add('show');
}

function confirmYes() {
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
  document.getElementById('confirmOverlay').classList.remove('show');
}

function confirmNo() {
  confirmCallback = null;
  document.getElementById('confirmOverlay').classList.remove('show');
}

/* ══════════════════════════════════════
   DRAG & DROP for import area
══════════════════════════════════════ */
function setupDragDrop() {
  const area = document.getElementById('importArea');
  if (!area) return;

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = area.querySelector('input[type="file"]');
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
  });
}

/* ══════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && ['nameInput', 'roleInput', 'companyInput'].includes(document.activeElement.id)) {
    addGuest();
  }
  if (e.key === 'Escape') {
    closeEditModal();
    confirmNo();
  }
  if (e.key === 'Enter' && ['editNameInput', 'editRoleInput', 'editCompanyInput'].includes(document.activeElement.id)) {
    saveEdit();
  }
});

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  const ok = await guardAuth();
  if (!ok) return;   // guardAuth() already redirected to /login

  document.body.classList.add('authed');   // reveal the page (see css/admin.css)
  loadGuests();
  setupDragDrop();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', onSearch);
  }
});
