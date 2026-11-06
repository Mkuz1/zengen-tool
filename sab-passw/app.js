/* SAB Passw — offline password vault.
 *
 * Security model
 *  - The vault is one JSON document encrypted with AES-256-GCM.
 *  - The key is derived from the master password with PBKDF2-SHA256 (600,000 iterations, random 16-byte salt).
 *  - Only the ciphertext, salt and IV are stored (localStorage). The key and decrypted records exist in
 *    memory only while unlocked, and are dropped on lock / auto-lock.
 *  - Encrypted backups (.sabpw) use the same scheme with their own password and salt.
 *  - Appearance settings are stored unencrypted because they contain nothing sensitive.
 */
'use strict';
(() => {
  // ---------------------------------------------------------------- constants
  const VAULT_KEY = 'sabpassw.vault.v1';
  const SETTINGS_KEY = 'sabpassw.settings.v1';
  const KDF_ITERATIONS = 600000;
  const VAULT_AAD = 'sab-passw-vault-v1';
  const BACKUP_AAD = 'sab-passw-backup-v1';
  const MAX_HISTORY = 20;

  const THEMES = [
    { id: 'aurora', name: 'Aurora', light: false, c: ['#5b8cff', '#a35cff', '#ff5fa8'] },
    { id: 'ocean', name: 'Ocean', light: false, c: ['#00b4d8', '#0077b6', '#2ec4b6'] },
    { id: 'sunset', name: 'Sunset', light: false, c: ['#ff7a59', '#ff3d7f', '#ffc15e'] },
    { id: 'forest', name: 'Forest', light: false, c: ['#2ec27e', '#00a676', '#c3e88d'] },
    { id: 'graphite', name: 'Graphite', light: false, c: ['#2f2f38', '#6e6e7a', '#8c8c99'] },
    { id: 'frost', name: 'Frost', light: true, c: ['#9ec5ff', '#c7b3ff', '#a5f3fc'] },
    { id: 'blossom', name: 'Blossom', light: true, c: ['#ffb3c8', '#ffd1a8', '#e0b3ff'] },
    { id: 'daylight', name: 'Daylight', light: true, c: ['#ffd36e', '#7ec8ff', '#a7f3d0'] }
  ];
  const ACCENTS = ['#6a5cff', '#0a84ff', '#30d158', '#ff9f0a', '#ff375f', '#bf5af2', '#14b8c4', '#e5a50a'];

  const DEFAULT_SETTINGS = {
    theme: 'aurora', accent: '#6a5cff', blur: 24, opacity: 18, radius: 28, motion: true,
    autoLock: 5, lockHidden: true, clip: 30, lastExport: null,
    gen: { len: 20, lower: true, upper: true, digits: true, symbols: true, similar: false }
  };

  const COMMON = ['password', '123456', '12345678', 'qwerty', 'letmein', 'admin', 'welcome', 'iloveyou',
    'monkey', 'dragon', 'abc123', '111111', 'football', 'baseball', 'sunshine', 'princess', 'master', 'passw0rd'];

  const ICONS = {
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    starOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  // ---------------------------------------------------------------- tiny helpers
  const $ = (s, r = document) => r.querySelector(s);
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'icon') n.innerHTML = ICONS[v]; // static markup only, never user data
      else if (k === 'style') Object.assign(n.style, v);
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : String(c));
    return n;
  }

  const b64 = (buf) => {
    const b = new Uint8Array(buf); let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const uid = () => b64(crypto.getRandomValues(new Uint8Array(12))).replace(/[+/=]/g, '');
  const now = () => new Date().toISOString();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const str = (v, max = 10000) => (v == null ? '' : String(v)).slice(0, max);

  function randomInt(max) { // uniform in [0, max) via rejection sampling
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do crypto.getRandomValues(buf); while (buf[0] >= limit);
    return buf[0] % max;
  }

  function normUrl(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    try { const p = new URL(u); return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : ''; } catch { return ''; }
  }
  function host(u) { try { return new URL(normUrl(u)).hostname.replace(/^www\./, ''); } catch { return ''; } }

  function hueOf(s) { let h = 0; for (const ch of s || '?') h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 360; }
  function avatar(rec, big) {
    const h = hueOf(rec.title);
    return el('div', {
      class: 'avatar', 'aria-hidden': 'true',
      style: { background: `linear-gradient(135deg, hsl(${h} 85% 64%), hsl(${(h + 45) % 360} 75% 48%))` },
      text: ([...(rec.title || '?').trim()][0] || '?').toUpperCase()
    });
  }

  // ---------------------------------------------------------------- crypto
  async function deriveKey(password, salt, iterations) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(key, obj, aad) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(aad) }, key, enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function unseal(key, env, aad) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv), additionalData: enc.encode(aad) }, key, unb64(env.ct));
    return JSON.parse(dec.decode(pt));
  }
  function newKdf() { return { alg: 'PBKDF2-SHA256', iter: KDF_ITERATIONS, salt: b64(crypto.getRandomValues(new Uint8Array(16))) }; }
  const keyFor = (pw, kdf) => deriveKey(pw, unb64(kdf.salt), kdf.iter);

  // ---------------------------------------------------------------- storage
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { ...DEFAULT_SETTINGS, ...s, gen: { ...DEFAULT_SETTINGS.gen, ...(s.gen || {}) } };
    } catch { return structuredClone(DEFAULT_SETTINGS); }
  }
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage full or blocked */ } }
  function readVault() { try { return JSON.parse(localStorage.getItem(VAULT_KEY) || 'null'); } catch { return null; } }

  let settings = loadSettings();
  let session = null; // { key, kdf, records }

  async function persist() {
    const env = await seal(session.key, { records: session.records }, VAULT_AAD);
    localStorage.setItem(VAULT_KEY, JSON.stringify({ format: 'sab-passw-vault', version: 1, kdf: session.kdf, ...env }));
  }

  // ---------------------------------------------------------------- records
  function normalizeRecord(r) {
    const fields = Array.isArray(r.fields) ? r.fields.slice(0, 50).map((f) => ({
      type: ['text', 'secret', 'question'].includes(f.type) ? f.type : 'text',
      label: str(f.label, 300), value: str(f.value, 5000)
    })).filter((f) => f.label || f.value) : [];
    const tags = (Array.isArray(r.tags) ? r.tags : str(r.tags).split(/[,;]/))
      .map((t) => str(t, 40).trim()).filter(Boolean).slice(0, 20);
    return {
      id: r.id && typeof r.id === 'string' ? r.id.slice(0, 40) : uid(),
      title: str(r.title, 200).trim() || host(r.url) || str(r.username, 200) || 'Untitled',
      username: str(r.username, 500), password: str(r.password, 500), url: str(r.url, 1000).trim(),
      notes: str(r.notes, 10000), tags: [...new Set(tags)], favorite: !!r.favorite && r.favorite !== 'false' && r.favorite !== '0',
      fields,
      history: Array.isArray(r.history) ? r.history.slice(0, MAX_HISTORY).map((h) => ({ password: str(h.password, 500), changedAt: str(h.changedAt, 40) })) : [],
      createdAt: str(r.createdAt, 40) || now(), updatedAt: str(r.updatedAt, 40) || now()
    };
  }
  const fingerprint = (r) => [r.title, r.username, r.password, normUrl(r.url)].join('\u0000').toLowerCase();

  // ---------------------------------------------------------------- strength & generator
  function strength(pw) {
    if (!pw) return { score: 0, label: '', color: 'transparent' };
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/\d/.test(pw)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
    let bits = [...pw].length * Math.log2(Math.max(pool, 2));
    if (/(.)\1{2,}/.test(pw)) bits -= 10;
    if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|wert|asdf)/i.test(pw)) bits -= 12;
    const lower = pw.toLowerCase().replace(/[@4]/g, 'a').replace(/0/g, 'o').replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/\$/g, 's');
    if (COMMON.some((c) => lower.includes(c))) bits = Math.min(bits, 18);
    const levels = [[28, 1, 'Weak', '#ff5a6e'], [40, 2, 'Fair', '#ff9f0a'], [60, 3, 'Good', '#ffd60a'], [80, 4, 'Strong', '#30d158'], [Infinity, 5, 'Excellent', '#14d9c4']];
    const [, score, label, color] = levels.find(([max]) => bits < max);
    return { score, label, color, bits: Math.max(0, Math.round(bits)) };
  }
  function paintMeter(meter, text, pw) {
    const s = strength(pw);
    meter.style.width = s.score * 20 + '%';
    meter.style.background = s.color;
    if (text) text.textContent = pw ? `${s.label} · about ${s.bits} bits of entropy` : '';
    return s;
  }

  const SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/~' };
  function generate(o) {
    const strip = (s) => (o.similar ? s.replace(/[Il1O0o|]/g, '') : s);
    const chosen = ['lower', 'upper', 'digits', 'symbols'].filter((k) => o[k]).map((k) => strip(SETS[k]));
    if (!chosen.length) return '';
    const all = chosen.join('');
    const out = chosen.map((set) => set[randomInt(set.length)]); // one of each selected class
    while (out.length < o.len) out.push(all[randomInt(all.length)]);
    for (let i = out.length - 1; i > 0; i--) { const j = randomInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
    return out.slice(0, o.len).join('');
  }

  // ---------------------------------------------------------------- UI: appearance
  const root = document.documentElement;
  function applySettings() {
    const t = THEMES.find((x) => x.id === settings.theme) || THEMES[0];
    root.dataset.theme = t.id;
    const a = settings.opacity / 100;
    root.style.setProperty('--accent', settings.accent);
    root.style.setProperty('--blur', settings.blur + 'px');
    root.style.setProperty('--alpha', String(a));
    root.style.setProperty('--alpha-strong', String(t.light ? Math.min(0.85, a + 0.38) : Math.min(0.7, a + 0.14)));
    root.style.setProperty('--radius', settings.radius + 'px');
    root.classList.toggle('still', !settings.motion);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.accent);
  }

  function buildSettingsUI() {
    const grid = $('#themeGrid'); grid.replaceChildren();
    for (const t of THEMES) {
      grid.append(el('button', {
        class: 'theme-swatch', type: 'button', role: 'radio', 'aria-checked': String(settings.theme === t.id), 'aria-label': t.name + ' theme',
        style: { background: `linear-gradient(135deg, ${t.c[0]}, ${t.c[1]} 55%, ${t.c[2]})` },
        onclick: () => { settings.theme = t.id; saveSettings(); applySettings(); buildSettingsUI(); }
      }, el('span', { text: t.name })));
    }
    const row = $('#accentRow'); row.replaceChildren();
    for (const c of ACCENTS) {
      row.append(el('button', {
        class: 'accent-dot', type: 'button', role: 'radio', 'aria-label': 'Accent ' + c, 'aria-checked': String(settings.accent.toLowerCase() === c),
        style: { background: c }, onclick: () => { settings.accent = c; saveSettings(); applySettings(); buildSettingsUI(); }
      }));
    }
    const picker = el('input', { type: 'color', value: settings.accent, 'aria-label': 'Custom accent colour' });
    picker.addEventListener('input', () => { settings.accent = picker.value; saveSettings(); applySettings(); });
    picker.addEventListener('change', buildSettingsUI);
    row.append(picker);

    $('#blurRange').value = settings.blur; $('#blurLabel').textContent = settings.blur + 'px';
    $('#opacityRange').value = settings.opacity; $('#opacityLabel').textContent = settings.opacity + '%';
    $('#radiusSel').value = String(settings.radius);
    $('#motionToggle').checked = settings.motion;
    $('#autoLockSel').value = String(settings.autoLock);
    $('#lockHiddenToggle').checked = settings.lockHidden;
    $('#clipSel').value = String(settings.clip);
    $('#lastExport').textContent = settings.lastExport ? 'Last export: ' + new Date(settings.lastExport).toLocaleString() : 'Never exported.';
  }

  function bindSettings() {
    const live = (id, key, fmt, label) => $(id).addEventListener('input', (e) => {
      settings[key] = fmt(e.target.value); if (label) $(label).textContent = e.target.value + (key === 'blur' ? 'px' : '%');
      saveSettings(); applySettings();
    });
    live('#blurRange', 'blur', Number, '#blurLabel');
    live('#opacityRange', 'opacity', Number, '#opacityLabel');
    $('#radiusSel').addEventListener('change', (e) => { settings.radius = Number(e.target.value); saveSettings(); applySettings(); });
    $('#motionToggle').addEventListener('change', (e) => { settings.motion = e.target.checked; saveSettings(); applySettings(); });
    $('#autoLockSel').addEventListener('change', (e) => { settings.autoLock = Number(e.target.value); saveSettings(); resetIdle(); });
    $('#lockHiddenToggle').addEventListener('change', (e) => { settings.lockHidden = e.target.checked; saveSettings(); });
    $('#clipSel').addEventListener('change', (e) => { settings.clip = Number(e.target.value); saveSettings(); });
  }

  // ---------------------------------------------------------------- UI: toast, prompt, clipboard
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /** Generic modal: resolves { button, values } or null if cancelled. */
  function ask({ title, text = '', fields = [], buttons = [], validate }) {
    const dlg = $('#promptSheet');
    $('#promptTitle').textContent = title;
    $('#promptText').textContent = text;
    $('#promptError').textContent = '';
    const box = $('#promptFields'); box.replaceChildren();
    for (const f of fields) {
      box.append(el('label', { class: 'field' }, el('span', { text: f.label }),
        el('input', { name: f.name, type: f.type || 'text', placeholder: f.placeholder || '', autocomplete: f.autocomplete || 'off', spellcheck: 'false' })));
    }
    const btns = $('#promptButtons'); btns.replaceChildren();
    btns.append(el('button', { type: 'button', class: 'btn ghost sm', text: 'Cancel', 'data-cancel': true }));
    for (const b of buttons) btns.append(el('button', { type: 'submit', class: 'btn sm ' + (b.cls || 'primary'), value: b.value, text: b.label }));
    return new Promise((resolve) => {
      const form = $('#promptForm');
      let done = false;
      const finish = (res) => { if (done) return; done = true; form.onsubmit = null; dlg.onclose = null; btns.onclick = null; if (dlg.open) dlg.close(); resolve(res); };
      btns.onclick = (e) => { if (e.target.closest('[data-cancel]')) finish(null); };
      // The close event is async: ignore a stale one that arrives after the next prompt reopened the dialog.
      dlg.onclose = () => { if (!dlg.open) finish(null); };
      form.onsubmit = async (e) => {
        e.preventDefault();
        const button = e.submitter ? e.submitter.value : (buttons[0] && buttons[0].value);
        const values = Object.fromEntries(fields.map((f) => [f.name, form.elements[f.name].value]));
        if (validate) {
          const subs = btns.querySelectorAll('button'); subs.forEach((b) => (b.disabled = true));
          let err;
          try { err = await validate(values, button); } catch (x) { err = x.message || String(x); }
          subs.forEach((b) => (b.disabled = false));
          if (err) { $('#promptError').textContent = err; return; }
        }
        finish({ button, values });
      };
      dlg.showModal();
      const first = box.querySelector('input'); if (first) first.focus();
    });
  }

  // Present when running inside the Android app (see sab-passw-android). It has no network access at all.
  const NATIVE = window.SABNative || null;

  let clipTimer;
  async function copy(text, label, secret) {
    if (NATIVE) {
      NATIVE.copy(text, !!secret);
      clearTimeout(clipTimer);
      if (secret && settings.clip > 0) {
        toast(`${label} copied · clears in ${settings.clip}s`);
        clipTimer = setTimeout(() => NATIVE.clearClipboard(), settings.clip * 1000);
      } else toast(label + ' copied');
      return;
    }
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = el('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); } finally { ta.remove(); }
    }
    clearTimeout(clipTimer);
    if (secret && settings.clip > 0) {
      toast(`${label} copied · clears in ${settings.clip}s`);
      clipTimer = setTimeout(() => { navigator.clipboard && navigator.clipboard.writeText('').catch(() => {}); }, settings.clip * 1000);
    } else toast(label + ' copied');
  }

  // ---------------------------------------------------------------- lock / unlock
  let failed = 0;
  let pendingImport = null; // records restored on the setup screen before a vault exists

  function showLock() {
    $('#vault').hidden = true; $('#lockScreen').hidden = false;
    const hasVault = !!readVault();
    $('#setupForm').hidden = hasVault; $('#unlockForm').hidden = !hasVault;
    $('#lockSubtitle').textContent = hasVault ? 'Locked. Enter your master password.' : 'Your passwords, sealed in glass.';
    (hasVault ? $('#unlockPw') : $('#setupPw')).focus();
  }

  function lock() {
    if (!session) return;
    session.records = null; session.key = null; session = null;
    document.querySelectorAll('dialog[open]').forEach((d) => d.close());
    $('#list').replaceChildren(); $('#chips').replaceChildren(); $('#search').value = '';
    $('#unlockPw').value = ''; $('#unlockError').textContent = '';
    clearTimeout(idleTimer);
    showLock();
  }

  function enterVault() {
    $('#lockScreen').hidden = true; $('#vault').hidden = false;
    $('#setupPw').value = $('#setupPw2').value = $('#unlockPw').value = '';
    filter = { q: '', chip: 'all' };
    render(); resetIdle();
  }

  $('#setupPw').addEventListener('input', (e) => paintMeter($('#setupMeter'), $('#setupStrength'), e.target.value));
  $('#setupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#setupPw').value, pw2 = $('#setupPw2').value;
    if (pw.length < 8) return toast('Use at least 8 characters');
    if (pw !== pw2) { $('#setupPw2').classList.add('shake'); setTimeout(() => $('#setupPw2').classList.remove('shake'), 400); return toast("Passwords don't match"); }
    if (strength(pw).score < 2) {
      const r = await ask({ title: 'Weak master password', text: 'This password is easy to guess. Everything in your vault depends on it.', buttons: [{ label: 'Use anyway', value: 'go', cls: 'danger' }] });
      if (!r) return;
    }
    const kdf = newKdf();
    session = { kdf, key: await keyFor(pw, kdf), records: pendingImport || [] };
    pendingImport = null;
    await persist();
    enterVault();
    toast(session.records.length ? `Vault created with ${session.records.length} restored items` : 'Vault created');
  });

  $('#unlockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#unlockBtn'); const vault = readVault();
    if (!vault) return showLock();
    btn.disabled = true; btn.textContent = 'Unlocking…'; $('#unlockError').textContent = '';
    try {
      const key = await keyFor($('#unlockPw').value, vault.kdf);
      const data = await unseal(key, vault, VAULT_AAD);
      session = { kdf: vault.kdf, key, records: (data.records || []).map(normalizeRecord) };
      failed = 0;
      enterVault();
    } catch {
      failed++;
      $('.lock-card').classList.add('shake'); setTimeout(() => $('.lock-card').classList.remove('shake'), 400);
      const wait = failed >= 3 ? Math.min(30, 2 ** (failed - 2)) : 0;
      $('#unlockError').textContent = 'Wrong password.' + (wait ? ` Try again in ${wait}s.` : '');
      if (wait) await sleep(wait * 1000);
    } finally { btn.disabled = false; btn.textContent = 'Unlock'; }
  });

  // auto-lock
  let idleTimer;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (session && settings.autoLock > 0) idleTimer = setTimeout(() => { lock(); toast('Locked after inactivity'); }, settings.autoLock * 60000);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, resetIdle, { passive: true }));
  let filePicking = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && session && settings.lockHidden && !filePicking && !NATIVE) lock();
  });
  // Called by the Android app when it goes to the background (it skips the call while a file picker is open).
  window.sabOnBackground = () => { if (session && settings.lockHidden) lock(); };

  // ---------------------------------------------------------------- vault list
  let filter = { q: '', chip: 'all' };

  function reuseMap() {
    const m = new Map();
    for (const r of session.records) if (r.password) m.set(r.password, (m.get(r.password) || 0) + 1);
    return m;
  }

  function render() {
    if (!session) return;
    const recs = session.records;
    const reuse = reuseMap();
    $('#countLabel').textContent = `${recs.length} item${recs.length === 1 ? '' : 's'}`;

    // chips
    const tags = [...new Set(recs.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b));
    const chips = [['all', 'All'], ['fav', '★ Favorites'], ['weak', 'Weak'], ['reused', 'Reused'], ...tags.map((t) => ['tag:' + t, '# ' + t])];
    if (!chips.some(([id]) => id === filter.chip)) filter.chip = 'all';
    $('#chips').replaceChildren(...chips.map(([id, label]) => el('button', {
      class: 'chip' + (filter.chip === id ? ' active' : ''), type: 'button', text: label, 'aria-pressed': String(filter.chip === id),
      onclick: () => { filter.chip = id; render(); }
    })));

    const q = filter.q.trim().toLowerCase();
    let list = recs.filter((r) => {
      if (filter.chip === 'fav' && !r.favorite) return false;
      if (filter.chip === 'weak' && !(r.password && strength(r.password).score <= 2)) return false;
      if (filter.chip === 'reused' && !(reuse.get(r.password) > 1)) return false;
      if (filter.chip.startsWith('tag:') && !r.tags.includes(filter.chip.slice(4))) return false;
      if (!q) return true;
      return [r.title, r.username, r.url, r.notes, ...r.tags, ...r.fields.filter((f) => f.type === 'text').map((f) => f.label + ' ' + f.value)]
        .some((s) => s && s.toLowerCase().includes(q));
    });
    const sort = $('#sortSel').value;
    list.sort((a, b) => sort === 'recent' ? b.updatedAt.localeCompare(a.updatedAt)
      : sort === 'weak' ? strength(a.password).score - strength(b.password).score || a.title.localeCompare(b.title)
        : (b.favorite - a.favorite) || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    $('#emptyState').hidden = recs.length > 0;
    $('#list').replaceChildren(...list.map((r, i) => {
      const s = r.password ? strength(r.password) : null;
      const badge = reuse.get(r.password) > 1 ? 'Reused' : (s && s.score <= 1 ? 'Weak' : null);
      return el('button', { class: 'item glass', type: 'button', style: { animationDelay: Math.min(i, 12) * 25 + 'ms' }, onclick: () => openView(r.id) },
        avatar(r),
        el('div', { class: 'item-main' }, el('strong', { text: (r.favorite ? '★ ' : '') + r.title }), el('span', { text: r.username || host(r.url) || 'No username' })),
        badge && el('span', { class: 'badge', text: badge }));
    }));
    if (recs.length && !list.length) $('#list').append(el('p', { class: 'muted small', style: { textAlign: 'center', padding: '20px' }, text: 'No matches.' }));
  }

  $('#search').addEventListener('input', (e) => { filter.q = e.target.value; render(); });
  $('#sortSel').addEventListener('change', render);

  // ---------------------------------------------------------------- view sheet
  function iconBtn(icon, label, onclick, extra = '') {
    return el('button', { class: 'icon-btn sm ' + extra, type: 'button', icon, 'aria-label': label, title: label, onclick });
  }

  function secretValue(value) {
    const v = el('span', { class: 'v mono', text: '••••••••••' });
    let shown = false;
    const toggle = iconBtn('eye', 'Show', () => {
      shown = !shown; v.textContent = shown ? value : '••••••••••';
      toggle.innerHTML = ICONS[shown ? 'eyeOff' : 'eye']; toggle.setAttribute('aria-label', shown ? 'Hide' : 'Show');
    });
    return { v, toggle };
  }

  function openView(id) {
    const r = session.records.find((x) => x.id === id); if (!r) return;
    const dlg = $('#viewSheet');
    const rows = [];
    const row = (k, vNode, ...btns) => rows.push(el('div', { class: 'detail-row' }, el('div', {}, el('span', { class: 'k', text: k }), vNode), ...btns));

    if (r.username) row('Username', el('span', { class: 'v', text: r.username }), iconBtn('copy', 'Copy username', () => copy(r.username, 'Username')));
    if (r.password) {
      const { v, toggle } = secretValue(r.password);
      const s = strength(r.password);
      row('Password · ' + s.label, v, toggle, iconBtn('copy', 'Copy password', () => copy(r.password, 'Password', true)));
    }
    if (r.url) {
      const href = normUrl(r.url);
      row('Website', el('span', { class: 'v', text: r.url }),
        href && el('a', { class: 'icon-btn sm', href, target: '_blank', rel: 'noopener noreferrer', icon: 'link', 'aria-label': 'Open website', title: 'Open website' }),
        iconBtn('copy', 'Copy website', () => copy(r.url, 'Website')));
    }
    for (const f of r.fields) {
      if (f.type === 'text') row(f.label || 'Field', el('span', { class: 'v', text: f.value }), iconBtn('copy', 'Copy', () => copy(f.value, f.label || 'Field')));
      else {
        const { v, toggle } = secretValue(f.value);
        row(f.type === 'question' ? 'Q: ' + (f.label || 'Security question') : (f.label || 'Hidden field'), v, toggle, iconBtn('copy', 'Copy', () => copy(f.value, f.type === 'question' ? 'Answer' : (f.label || 'Field'), true)));
      }
    }
    if (r.notes) row('Notes', el('span', { class: 'v', text: r.notes }));

    const star = iconBtn(r.favorite ? 'starOn' : 'star', r.favorite ? 'Remove from favorites' : 'Add to favorites', async () => {
      r.favorite = !r.favorite; await persist(); render(); openView(r.id);
    }, r.favorite ? 'on' : '');

    const history = r.history.length ? el('details', { class: 'history' }, el('summary', { text: `Password history (${r.history.length})` }),
      el('ul', {}, r.history.map((h) => el('li', { text: `${h.password}  ·  ${new Date(h.changedAt).toLocaleDateString()}` })))) : null;

    dlg.replaceChildren(el('div', { class: 'stack' },
      el('div', { class: 'sheet-head' },
        el('button', { class: 'btn ghost sm', type: 'button', text: 'Close', onclick: () => dlg.close() }),
        el('span'),
        el('button', { class: 'btn primary sm', type: 'button', text: 'Edit', onclick: () => { dlg.close(); openEdit(r.id); } })),
      el('div', { class: 'detail-hero' }, avatar(r, true),
        el('div', { style: { flex: '1', minWidth: '0' } }, el('h2', { text: r.title }), el('span', { class: 'muted small', text: host(r.url) || 'Updated ' + new Date(r.updatedAt).toLocaleDateString() })),
        star),
      r.tags.length ? el('div', { class: 'tags' }, r.tags.map((t) => el('span', { class: 'tag', text: t }))) : null,
      ...rows,
      history,
      el('div', { class: 'row wrap' },
        el('button', { class: 'btn ghost sm', type: 'button', text: 'Duplicate', onclick: async () => {
          const copyRec = normalizeRecord({ ...structuredClone(r), id: null, title: r.title + ' copy', history: [], createdAt: null, updatedAt: null });
          session.records.push(copyRec); await persist(); render(); openView(copyRec.id); toast('Duplicated');
        } }),
        el('button', { class: 'btn danger sm', type: 'button', text: 'Delete', onclick: async () => {
          const ok = await ask({ title: 'Delete this record?', text: `"${r.title}" will be removed permanently.`, buttons: [{ label: 'Delete', value: 'del', cls: 'danger' }] });
          if (!ok) return;
          session.records = session.records.filter((x) => x.id !== r.id); await persist(); dlg.close(); render(); toast('Deleted');
        } })),
      el('p', { class: 'muted small', text: `Created ${new Date(r.createdAt).toLocaleString()} · Updated ${new Date(r.updatedAt).toLocaleString()}` })));
    if (!dlg.open) dlg.showModal();
  }

  // ---------------------------------------------------------------- edit sheet
  let editingId = null;
  const form = $('#editForm');
  const F = form.elements;

  function fieldRow(f) {
    const isQ = f.type === 'question';
    const secretBox = el('input', { type: 'checkbox' }); secretBox.checked = f.type !== 'text';
    const valInput = el('input', { 'data-v': true, placeholder: isQ ? 'Answer' : 'Value', type: f.type === 'text' ? 'text' : 'password', maxlength: '5000', spellcheck: 'false' });
    valInput.value = f.value || '';
    secretBox.addEventListener('change', () => { valInput.type = secretBox.checked ? 'password' : 'text'; });
    const labInput = el('input', { 'data-l': true, placeholder: isQ ? 'Security question' : 'Label', maxlength: '300' }); labInput.value = f.label || '';
    const wrap = el('div', { class: 'custom-field', 'data-type': f.type },
      labInput, valInput,
      el('div', { class: 'row' },
        isQ ? iconBtn('eye', 'Show answer', () => { valInput.type = valInput.type === 'password' ? 'text' : 'password'; })
          : el('label', { class: 'toggle', title: 'Hidden field' }, secretBox, el('span')),
        iconBtn('x', 'Remove field', () => wrap.remove())));
    if (!isQ) wrap._secret = secretBox;
    return wrap;
  }

  function openEdit(id, preset) {
    editingId = id || null;
    const r = id ? session.records.find((x) => x.id === id) : normalizeRecord({ title: ' ', ...(preset || {}) });
    $('#editTitle').textContent = id ? 'Edit record' : 'New record';
    F.title.value = id ? r.title : '';
    F.username.value = r.username; F.password.value = r.password; F.url.value = r.url;
    F.tags.value = r.tags.join(', '); F.notes.value = r.notes; F.favorite.checked = r.favorite;
    F.password.type = 'password';
    $('#customFields').replaceChildren(...r.fields.map(fieldRow));
    paintMeter($('#editMeter'), $('#editStrength'), r.password);
    $('#editSheet').showModal();
    F.title.focus();
  }

  F.password.addEventListener('input', () => paintMeter($('#editMeter'), $('#editStrength'), F.password.value));
  form.querySelector('[data-toggle-pw]').addEventListener('click', (e) => {
    const show = F.password.type === 'password'; F.password.type = show ? 'text' : 'password';
    e.currentTarget.innerHTML = ICONS[show ? 'eyeOff' : 'eye'];
  });
  $('#addFieldBtn').addEventListener('click', () => $('#customFields').append(fieldRow({ type: 'text', label: '', value: '' })));
  $('#addQaBtn').addEventListener('click', () => $('#customFields').append(fieldRow({ type: 'question', label: '', value: '' })));
  $('#editGen').addEventListener('click', () => openGenerator((pw) => { F.password.value = pw; F.password.type = 'text'; paintMeter($('#editMeter'), $('#editStrength'), pw); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = [...$('#customFields').children].map((w) => ({
      type: w.dataset.type === 'question' ? 'question' : (w._secret && w._secret.checked ? 'secret' : 'text'),
      label: w.querySelector('[data-l]').value.trim(), value: w.querySelector('[data-v]').value
    }));
    const data = {
      title: F.title.value, username: F.username.value.trim(), password: F.password.value, url: F.url.value,
      tags: F.tags.value, notes: F.notes.value, favorite: F.favorite.checked, fields
    };
    if (editingId) {
      const i = session.records.findIndex((x) => x.id === editingId);
      const old = session.records[i];
      const history = [...old.history];
      if (old.password && old.password !== data.password) history.unshift({ password: old.password, changedAt: now() });
      session.records[i] = normalizeRecord({ ...old, ...data, history: history.slice(0, MAX_HISTORY), updatedAt: now() });
    } else {
      session.records.push(normalizeRecord({ ...data, createdAt: now(), updatedAt: now() }));
    }
    await persist();
    $('#editSheet').close(); render();
    toast(editingId ? 'Saved' : 'Added');
    if (editingId) openView(editingId);
  });

  // ---------------------------------------------------------------- generator sheet
  let genCallback = null;
  function regen() {
    const g = settings.gen;
    const pw = generate(g);
    const out = $('#genOut'); out.replaceChildren();
    if (!pw) { out.textContent = 'Pick at least one character type'; return; }
    for (const ch of pw) out.append(/\d/.test(ch) ? el('span', { class: 'd', text: ch }) : /[^a-zA-Z]/.test(ch) ? el('span', { class: 's', text: ch }) : ch);
    out.dataset.pw = pw;
    paintMeter($('#genMeter'), $('#genStrength'), pw);
  }
  function openGenerator(cb) {
    genCallback = cb || null;
    const g = settings.gen;
    $('#genLen').value = g.len; $('#genLenLabel').textContent = g.len;
    for (const k of ['lower', 'upper', 'digits', 'symbols', 'similar']) $('#gen' + k[0].toUpperCase() + k.slice(1)).checked = g[k];
    $('#genUse').hidden = !cb;
    regen(); $('#genSheet').showModal();
  }
  $('#genLen').addEventListener('input', (e) => { settings.gen.len = Number(e.target.value); $('#genLenLabel').textContent = e.target.value; saveSettings(); regen(); });
  for (const k of ['lower', 'upper', 'digits', 'symbols', 'similar']) {
    $('#gen' + k[0].toUpperCase() + k.slice(1)).addEventListener('change', (e) => { settings.gen[k] = e.target.checked; saveSettings(); regen(); });
  }
  $('#genNew').addEventListener('click', regen);
  $('#genCopy').addEventListener('click', () => { const pw = $('#genOut').dataset.pw; if (pw) copy(pw, 'Password', true); });
  $('#genUse').addEventListener('click', () => { const pw = $('#genOut').dataset.pw; if (pw && genCallback) genCallback(pw); $('#genSheet').close(); });

  // ---------------------------------------------------------------- export
  /** Saves a file. Returns true when the Android app took over (it shows its own result message). */
  function download(name, text, type, doneMsg) {
    if (NATIVE) { NATIVE.saveFile(name, type, text, doneMsg); return true; }
    const blob = new Blob([text], { type });
    const a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    return false;
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  async function verifyMaster(pw) {
    const vault = readVault();
    try { await unseal(await keyFor(pw, vault.kdf), vault, VAULT_AAD); return true; } catch { return false; }
  }

  $('#exportEncBtn').addEventListener('click', async () => {
    const res = await ask({
      title: 'Encrypted backup',
      text: `All ${session.records.length} items will be encrypted with this backup password. You'll need it to import the file.`,
      fields: [{ name: 'a', label: 'Backup password', type: 'password', autocomplete: 'new-password' }, { name: 'b', label: 'Confirm backup password', type: 'password', autocomplete: 'new-password' }],
      buttons: [{ label: 'Export', value: 'go' }],
      validate: (v) => v.a.length < 8 ? 'Use at least 8 characters.' : v.a !== v.b ? "Passwords don't match." : null
    });
    if (!res) return;
    const kdf = newKdf();
    const env = await seal(await keyFor(res.values.a, kdf), { records: session.records }, BACKUP_AAD);
    const file = { format: 'sab-passw-backup', version: 1, app: 'SAB Passw', exportedAt: now(), count: session.records.length, kdf, ...env };
    const msg = `Exported ${session.records.length} items (encrypted)`;
    const native = download(`SAB-Passw-backup-${stamp()}.sabpw`, JSON.stringify(file), 'application/octet-stream', msg);
    settings.lastExport = now(); saveSettings(); buildSettingsUI();
    if (!native) toast(msg);
  });

  const csvCell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  $('#exportCsvBtn').addEventListener('click', async () => {
    const res = await ask({
      title: 'Export unencrypted CSV?',
      text: 'The file will contain every password in plain text. Store it somewhere safe and delete it when you no longer need it. Enter your master password to continue.',
      fields: [{ name: 'pw', label: 'Master password', type: 'password', autocomplete: 'current-password' }],
      buttons: [{ label: 'Export CSV', value: 'go', cls: 'danger' }],
      validate: async (v) => (await verifyMaster(v.pw)) ? null : 'Wrong master password.'
    });
    if (!res) return;
    const head = ['title', 'username', 'password', 'url', 'notes', 'tags', 'favorite', 'custom_fields', 'created', 'updated'];
    const lines = [head.join(',')].concat(session.records.map((r) => [r.title, r.username, r.password, r.url, r.notes, r.tags.join(', '),
      r.favorite ? 'true' : 'false', r.fields.length ? JSON.stringify(r.fields) : '', r.createdAt, r.updatedAt].map(csvCell).join(',')));
    const msg = `Exported ${session.records.length} items to CSV`;
    const native = download(`SAB-Passw-export-${stamp()}.csv`, '\ufeff' + lines.join('\r\n'), 'text/csv', msg);
    settings.lastExport = now(); saveSettings(); buildSettingsUI();
    if (!native) toast(msg);
  });

  // ---------------------------------------------------------------- import
  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
  }

  // Column names used by common password managers and browsers, normalised to lowercase letters/digits.
  const ALIASES = {
    title: ['title', 'name', 'account', 'entry', 'item', 'itemname', 'accountname', 'sitename'],
    username: ['username', 'user', 'login', 'loginusername', 'loginname', 'email', 'emailaddress', 'userid', 'usernamelogin'],
    password: ['password', 'pass', 'loginpassword', 'pwd', 'passwd'],
    url: ['url', 'website', 'uri', 'loginuri', 'web', 'siteurl', 'address', 'hostname', 'loginurl', 'site'],
    notes: ['notes', 'note', 'extra', 'comments', 'comment', 'description'],
    tags: ['tags', 'tag', 'folder', 'grouping', 'group', 'category', 'categories', 'labels', 'collections'],
    favorite: ['favorite', 'favourite', 'fav', 'starred'],
    fields: ['customfields'],
    createdAt: ['created', 'createdat', 'timecreated'],
    updatedAt: ['updated', 'updatedat', 'modified', 'lastmodified']
  };

  function recordsFromCsv(text) {
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error('The CSV file has no data rows.');
    const head = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const col = {};
    for (const [key, names] of Object.entries(ALIASES)) {
      const idx = names.map((n) => head.indexOf(n)).find((i) => i >= 0);
      if (idx !== undefined) col[key] = idx;
    }
    if (col.password === undefined && col.username === undefined) throw new Error("Couldn't find username or password columns in this CSV.");
    return rows.slice(1).map((r) => {
      const get = (k) => (col[k] === undefined ? '' : (r[col[k]] || ''));
      let fields = [];
      if (get('fields')) { try { fields = JSON.parse(get('fields')); } catch { fields = [{ type: 'text', label: 'Imported field', value: get('fields') }]; } }
      const fav = get('favorite').trim().toLowerCase();
      const ts = (v) => { const d = v && new Date(/^\d{10,13}$/.test(v) ? Number(v.length === 10 ? v * 1000 : v) : v); return d && !isNaN(d) ? d.toISOString() : null; };
      return normalizeRecord({
        title: get('title'), username: get('username'), password: get('password'), url: get('url'), notes: get('notes'),
        tags: get('tags').replace(/[/\\]/g, ','), favorite: ['1', 'true', 'yes', 'y', '★'].includes(fav), fields,
        createdAt: ts(get('createdAt')), updatedAt: ts(get('updatedAt'))
      });
    }).filter((r) => r.username || r.password || r.notes || r.fields.length);
  }

  async function recordsFromFile(file) {
    if (file.size > 20 * 1024 * 1024) throw new Error('That file is too large (20 MB maximum).');
    const text = await file.text();
    const trimmed = text.trim();
    if (/\.csv$/i.test(file.name) || !trimmed.startsWith('{')) return recordsFromCsv(text);
    let json; try { json = JSON.parse(trimmed); } catch { throw new Error("This file isn't valid JSON or CSV."); }
    if (json.format !== 'sab-passw-backup' || !json.kdf || !json.iv || !json.ct) throw new Error("This isn't a SAB Passw backup file.");
    const res = await ask({
      title: 'Backup password',
      text: `Enter the password used when this backup was exported${json.exportedAt ? ' on ' + new Date(json.exportedAt).toLocaleString() : ''}.`,
      fields: [{ name: 'pw', label: 'Backup password', type: 'password', autocomplete: 'off' }],
      buttons: [{ label: 'Decrypt', value: 'go' }],
      validate: async (v) => {
        try { json._data = await unseal(await keyFor(v.pw, json.kdf), json, BACKUP_AAD); return null; } catch { return 'Wrong password, or the file is damaged.'; }
      }
    });
    if (!res) return null;
    return (json._data.records || []).map(normalizeRecord);
  }

  async function chooseFile() {
    const input = $('#fileInput'); input.value = '';
    filePicking = true;
    return new Promise((resolve) => {
      const done = (f) => { input.onchange = null; input.oncancel = null; window.removeEventListener('focus', onFocus); setTimeout(() => { filePicking = false; }, 500); resolve(f); };
      const onFocus = () => setTimeout(() => { if (!input.files.length) done(null); }, 1200);
      input.onchange = () => done(input.files[0] || null);
      input.oncancel = () => done(null);
      window.addEventListener('focus', onFocus);
      input.click();
    });
  }

  async function importFlow() {
    const file = await chooseFile(); if (!file) return;
    let incoming;
    try { incoming = await recordsFromFile(file); } catch (e) { return toast(e.message); }
    if (!incoming) return;
    if (!incoming.length) return toast('No passwords found in that file');

    if (!session) { // restoring on first launch, before a vault exists
      pendingImport = incoming;
      $('#lockSubtitle').textContent = `${incoming.length} items ready to restore. Create a master password to finish.`;
      $('#setupPw').focus();
      return;
    }
    let mode = 'merge';
    if (session.records.length) {
      const r = await ask({
        title: `Import ${incoming.length} items`,
        text: `Merge adds new items and skips exact duplicates. Replace deletes the ${session.records.length} items currently in your vault first.`,
        buttons: [{ label: 'Replace all', value: 'replace', cls: 'danger' }, { label: 'Merge', value: 'merge' }]
      });
      if (!r) return;
      mode = r.button;
    }
    let added = 0, skipped = 0;
    if (mode === 'replace') { session.records = incoming; added = incoming.length; }
    else {
      const seen = new Set(session.records.map(fingerprint));
      const ids = new Set(session.records.map((r) => r.id));
      for (const r of incoming) {
        const fp = fingerprint(r);
        if (seen.has(fp)) { skipped++; continue; }
        if (ids.has(r.id)) r.id = uid();
        seen.add(fp); ids.add(r.id); session.records.push(r); added++;
      }
    }
    await persist(); render();
    toast(`Imported ${added} item${added === 1 ? '' : 's'}` + (skipped ? ` · ${skipped} duplicate${skipped === 1 ? '' : 's'} skipped` : ''));
  }

  $('#importBtn').addEventListener('click', importFlow);
  $('#setupImportBtn').addEventListener('click', importFlow);

  // ---------------------------------------------------------------- master password & wipe
  $('#changePwBtn').addEventListener('click', async () => {
    const res = await ask({
      title: 'Change master password',
      fields: [
        { name: 'cur', label: 'Current password', type: 'password', autocomplete: 'current-password' },
        { name: 'a', label: 'New password', type: 'password', autocomplete: 'new-password' },
        { name: 'b', label: 'Confirm new password', type: 'password', autocomplete: 'new-password' }],
      buttons: [{ label: 'Change', value: 'go' }],
      validate: async (v) => {
        if (v.a.length < 8) return 'New password needs at least 8 characters.';
        if (v.a !== v.b) return "New passwords don't match.";
        if (strength(v.a).score < 2) return 'Choose a stronger new password.';
        return (await verifyMaster(v.cur)) ? null : 'Current password is wrong.';
      }
    });
    if (!res) return;
    session.kdf = newKdf();
    session.key = await keyFor(res.values.a, session.kdf);
    await persist();
    toast('Master password changed');
  });

  $('#wipeBtn').addEventListener('click', async () => {
    const res = await ask({
      title: 'Erase vault?',
      text: 'This permanently deletes every password stored on this device. Export a backup first if you might need them. Type ERASE to confirm.',
      fields: [{ name: 'c', label: 'Type ERASE', autocomplete: 'off' }],
      buttons: [{ label: 'Erase everything', value: 'go', cls: 'danger' }],
      validate: (v) => v.c.trim() === 'ERASE' ? null : 'Type ERASE in capitals to confirm.'
    });
    if (!res) return;
    localStorage.removeItem(VAULT_KEY);
    session = null; location.reload();
  });

  // ---------------------------------------------------------------- wiring
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]'); if (c) c.closest('dialog').close();
  });
  $('#addBtn').addEventListener('click', () => openEdit(null));
  $('#emptyAdd').addEventListener('click', () => openEdit(null));
  $('#genBtn').addEventListener('click', () => openGenerator(null));
  $('#settingsBtn').addEventListener('click', () => { buildSettingsUI(); $('#settingsSheet').showModal(); });
  $('#lockBtn').addEventListener('click', lock);
  document.addEventListener('keydown', (e) => {
    if (!session || document.querySelector('dialog[open]')) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); $('#search').focus(); }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') { e.preventDefault(); lock(); }
  });

  // Android back button: close the top sheet if one is open; returns false to let the app exit.
  window.sabBack = () => {
    const open = [...document.querySelectorAll('dialog[open]')];
    if (!open.length) return false;
    open[open.length - 1].close(); return true;
  };
  window.sabToast = (msg) => toast(String(msg));

  bindSettings();
  applySettings();
  showLock();
  if (NATIVE) {
    $('#privacyNote').textContent = 'SAB Passw stores your vault only on this phone, encrypted with AES-256-GCM. The app has no internet permission, and Android cloud backup is turned off, so nothing can leave the device.';
  } else if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
