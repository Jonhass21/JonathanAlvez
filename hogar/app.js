'use strict';
/* Economía del Hogar — Panel del mes.
   Todo se guarda en localStorage de este dispositivo. */

const KEY = 'hogar-v1';
const PEOPLE = ['marisol', 'jona'];
const RECURRING = ['fijos', 'ing.marisol', 'ing.jona']; // se copian al mes siguiente

/* ---------- formato ---------- */
const fmtArs = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });
const ars = n => fmtArs.format(n || 0); // con espacio duro: "$ 1.234" nunca se corta en dos renglones
const usd = n => 'US$\u00a0' + fmtNum.format(n || 0);
const arsShort = n => '$\u00a0' + fmtCompact.format(n || 0);
const short = n => fmtCompact.format(n || 0);

// Acepta "1.234.567,89", "1234567.89", "1500", "1.500", "$ 20.000"
function parseAmt(str) {
  let s = String(str || '').replace(/[^\d.,-]/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if ((s.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
const plainNum = n => n ? fmtNum.format(n).replace(/,00$/, '') : '';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const $ = id => document.getElementById(id);

/* ---------- meses ---------- */
const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
function shiftKey(k, n) { const [y, m] = k.split('-').map(Number); return monthKey(new Date(y, m - 1 + n, 1)); }
function monthLabel(k) {
  const [y, m] = k.split('-').map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const TODAY = monthKey(new Date());

/* ---------- estado ---------- */
function emptyState() { return { v: 1, meta: { metaPct: 20, theme: 'auto', lastBackup: null }, months: {} }; }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.months) { s.meta = Object.assign(emptyState().meta, s.meta); return s; }
  } catch (e) { /* sin datos o almacenamiento bloqueado */ }
  return emptyState();
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('No se pudo guardar en este dispositivo. Exportá un respaldo.'); }
}

function blankMonth() {
  return {
    tc: 0, fijos: [], variables: [],
    ingresos: { marisol: [], jona: [] },
    ahorro: { marisol: { m: 0, cur: 'USD' }, jona: { m: 0, cur: 'USD' } },
  };
}
const prevStoredKey = k => Object.keys(S.months).filter(x => x < k).sort().pop();

// Un mes sin datos se arma a partir del último mes anterior guardado (no se guarda hasta que lo tocás).
function templateFor(k) {
  const b = blankMonth();
  const p = S.months[prevStoredKey(k)];
  if (!p) return b;
  const copy = x => ({ id: uid(), sid: x.sid || x.id, n: x.n, m: x.m, ok: false });
  b.tc = p.tc || 0;
  b.fijos = p.fijos.map(copy);
  PEOPLE.forEach(pp => {
    b.ingresos[pp] = p.ingresos[pp].map(copy);
    b.ahorro[pp].cur = p.ahorro[pp].cur;
  });
  return b;
}

let curKey = TODAY;
let view = null;
function openMonth(k) {
  curKey = k;
  view = S.months[k] || templateFor(k);
  editing = null;
  render();
}

function getList(month, path) {
  if (path.startsWith('ing.')) return month.ingresos[path.slice(4)];
  return month[path];
}
function laterStored(k) { return Object.keys(S.months).filter(x => x > k); }

function commit() {
  S.months[curKey] = view;
  save();
  render();
}

/* ---------- acciones ---------- */
let editing = null;  // {path, id}
let justId = null;   // fila recién tildada (para animar solo esa)
let newId = null;

function addItem(path, n, m) {
  const it = { id: uid(), n, m, ok: false };
  it.sid = it.id;
  getList(view, path).push(it);
  if (RECURRING.includes(path)) {
    laterStored(curKey).forEach(k => getList(S.months[k], path).push({ id: uid(), sid: it.sid, n, m, ok: false }));
  }
  newId = it.id;
  commit();
}

function toggleItem(path, id) {
  const it = getList(view, path).find(x => x.id === id);
  if (!it) return;
  it.ok = !it.ok;
  justId = it.ok ? id : null;
  if (navigator.vibrate && it.ok) navigator.vibrate(12);
  commit();
}

function updateItem(path, id, n, m) {
  const it = getList(view, path).find(x => x.id === id);
  if (!it) return;
  it.n = n; it.m = m;
  editing = null;
  commit();
}

function deleteItem(path, id) {
  const snapshot = JSON.stringify(S);
  const list = getList(view, path);
  const i = list.findIndex(x => x.id === id);
  if (i < 0) return;
  const [it] = list.splice(i, 1);
  // Si es recurrente, también sale de los meses siguientes ya creados
  if (RECURRING.includes(path)) {
    laterStored(curKey).forEach(k => {
      const l = getList(S.months[k], path);
      for (let j = l.length - 1; j >= 0; j--) if ((l[j].sid || l[j].id) === (it.sid || it.id)) l.splice(j, 1);
    });
  }
  editing = null;
  commit();
  toast(`“${it.n}” borrado`, () => { S = JSON.parse(snapshot); save(); openMonth(curKey); });
}

/* ---------- cálculos ---------- */
const sum = (l, f = () => true) => l.filter(f).reduce((a, b) => a + (b.m || 0), 0);
function savingArs(a, tc) { return a.cur === 'USD' ? a.m * (tc || 0) : a.m; }
function savingUsd(a, tc) { return a.cur === 'USD' ? a.m : (tc ? a.m / tc : 0); }

function totals(month) {
  const ingP = {}, cobP = {};
  PEOPLE.forEach(p => { ingP[p] = sum(month.ingresos[p]); cobP[p] = sum(month.ingresos[p], x => x.ok); });
  const ing = ingP.marisol + ingP.jona;
  const fij = sum(month.fijos), fijPag = sum(month.fijos, x => x.ok);
  const vari = sum(month.variables), varPag = sum(month.variables, x => x.ok);
  let ahoArs = 0, ahoUsd = 0;
  PEOPLE.forEach(p => { ahoArs += savingArs(month.ahorro[p], month.tc); ahoUsd += savingUsd(month.ahorro[p], month.tc); });
  return { ingP, cobP, ing, fij, fijPag, vari, varPag, gas: fij + vari, ahoArs, ahoUsd, libre: ing - fij - vari - ahoArs };
}

function accumulatedUsd() {
  let t = 0;
  const keys = new Set(Object.keys(S.months).filter(k => k <= curKey));
  keys.add(curKey);
  keys.forEach(k => {
    const m = k === curKey ? view : S.months[k];
    PEOPLE.forEach(p => { t += savingUsd(m.ahorro[p], m.tc); });
  });
  return t;
}

/* ---------- render ---------- */
function animateNum(el, value, fmt) {
  const from = el._v ?? value;
  el._v = value;
  if (from === value || matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(value); return; }
  const t0 = performance.now(), dur = 450;
  cancelAnimationFrame(el._raf);
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (value - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}

function rowHtml(path, it, income) {
  if (editing && editing.path === path && editing.id === it.id) {
    return `<form class="row edit" data-edit="${path}" data-id="${it.id}">
      <input name="n" value="${esc(it.n)}" aria-label="Nombre" autocomplete="off">
      <input name="m" class="amt num" value="${plainNum(it.m)}" inputmode="decimal" aria-label="Monto" autocomplete="off">
      <button class="mini-btn save" aria-label="Guardar">✓</button>
      <button type="button" class="mini-btn del" data-del aria-label="Borrar">✕</button>
    </form>`;
  }
  const cls = ['row', it.ok && 'done', it.id === justId && 'just', it.id === newId && 'new'].filter(Boolean).join(' ');
  const tag = income ? `<small><span class="tag">${it.ok ? 'cobrado' : 'pendiente'}</span></small>` : '';
  const lbl = income ? (it.ok ? 'Marcar como pendiente' : 'Marcar como cobrado') : (it.ok ? 'Marcar como no pagado' : 'Marcar como pagado');
  return `<div class="${cls}" data-path="${path}" data-id="${it.id}">
    <button class="tick" data-tick aria-label="${lbl}: ${esc(it.n)}">${it.ok ? '✓' : ''}</button>
    <button class="t" data-open title="Tocá para editar">${esc(it.n)}${tag}</button>
    <button class="m num" data-open title="Tocá para editar">${ars(it.m)}</button>
  </div>`;
}

function renderList(path) {
  const el = document.querySelector(`[data-list="${path}"]`);
  const list = getList(view, path);
  const income = path.startsWith('ing.');
  el.innerHTML = list.length
    ? list.map(it => rowHtml(path, it, income)).join('')
    : `<div class="empty">${income ? 'Sin ingresos cargados.' : 'Nada cargado todavía.'} Escribí nombre y monto abajo.</div>`;
  const f = el.querySelector('form.edit');
  if (f) { const i = f.querySelector('[name=m]'); i.focus(); i.select(); }
}

function renderProg(id, paid, total) {
  const el = $(id), p = total ? paid / total * 100 : 0;
  el.querySelector('.fill').style.width = p + '%';
  el.querySelector('[data-t]').innerHTML = `Pagado <b class="num">${ars(paid)}</b> de <span class="num">${ars(total)}</span>`;
  el.querySelector('[data-p]').textContent = total && paid >= total ? '¡Todo pagado!' : Math.round(p) + '%';
  el.classList.toggle('full', total > 0 && paid >= total);
}

let savingEdit = null;
function renderSavers() {
  document.querySelectorAll('.saver').forEach(card => {
    const p = card.dataset.s, a = view.ahorro[p], tc = view.tc;
    const name = p === 'jona' ? 'Jona' : 'Marisol';
    const main = a.cur === 'USD' ? usd(a.m) : ars(a.m);
    let eq = '';
    if (a.m) eq = a.cur === 'USD' ? (tc ? '≈ ' + ars(a.m * tc) : 'Cargá el dólar para ver en pesos') : (tc ? '≈ ' + usd(a.m / tc) : '');
    const amount = savingEdit === p
      ? `<input class="amount num" data-sin="${p}" value="${plainNum(a.m)}" inputmode="decimal" autocomplete="off" aria-label="Ahorro de ${name}">`
      : `<button class="amount num ${a.m ? '' : 'zero'}" data-sedit="${p}">${a.m ? main : '+ Tocá para cargar'}</button>`;
    card.innerHTML = `<div class="name"><span>${name}</span>
      <span class="cur" role="group" aria-label="Moneda">
        <button data-cur="ARS" class="${a.cur === 'ARS' ? 'on' : ''}" aria-pressed="${a.cur === 'ARS'}">$</button>
        <button data-cur="USD" class="${a.cur === 'USD' ? 'on' : ''}" aria-pressed="${a.cur === 'USD'}">US$</button>
      </span></div>${amount}<div class="eq num">${eq}</div>`;
    const inp = card.querySelector('input');
    if (inp) { inp.focus(); inp.select(); }
  });
}

function signalFor(t) {
  const pending = view.fijos.filter(x => !x.ok);
  const meta = S.meta.metaPct || 0;
  const pct = t.ing ? Math.round(t.ahoArs / t.ing * 100) : 0;
  if (!t.ing && !t.gas && !t.ahoArs) return ['neutral', 'Empezá cargando los ingresos y los gastos del mes.'];
  if (t.libre < 0) return ['bad', `Cuidado: gastos + ahorro superan los ingresos por ${ars(-t.libre)}.`];
  if (pending.length) {
    const s = pending.length > 1 ? 's' : '';
    return ['warn', `Ojo, falta${pending.length > 1 ? 'n' : ''} pagar ${pending.length} gasto${s} fijo${s} (${ars(sum(pending))}).`];
  }
  if (t.ing && pct >= meta) return ['ok', `Vamos bien: ahorraron el ${pct}% de lo que ingresó. ${meta ? '¡Meta cumplida!' : ''}`.trim()];
  if (t.ing) return ['warn', `Fijos al día. Ahorro: ${pct}% de lo que ingresó (meta ${meta}%).`];
  return ['ok', 'Fijos al día.'];
}

function render() {
  const t = totals(view);
  $('monthTitle').textContent = monthLabel(curKey);
  $('todayBtn').hidden = curKey === TODAY;
  const stored = !!S.months[curKey];
  $('copiedNote').hidden = stored || !(view.fijos.length || view.ingresos.marisol.length || view.ingresos.jona.length);

  // resumen
  animateNum($('sIng'), t.ing, ars);
  animateNum($('sGas'), t.gas, ars);
  animateNum($('sAho'), t.ahoArs, ars);
  animateNum($('sLib'), t.libre, ars);
  $('freeBox').classList.toggle('neg', t.libre < 0);
  const [lvl, msg] = signalFor(t);
  $('signal').className = 'signal ' + lvl;
  $('sigTxt').textContent = msg;
  $('miniDot').className = 'dot ' + lvl;
  $('miniLib').textContent = arsShort(t.libre);
  $('miniRest').textContent = `Ing ${short(t.ing)} · Gas ${short(t.gas)} · Aho ${short(t.ahoArs)}`;

  // ingresos
  $('tIng').textContent = ars(t.ing);
  PEOPLE.forEach(p => {
    const card = document.querySelector(`.person[data-p="${p}"]`);
    card.querySelector('[data-tot]').textContent = ars(t.ingP[p]);
    card.querySelector('[data-cob]').textContent = t.ingP[p] ? `cobrado ${ars(t.cobP[p])}` : '';
    renderList('ing.' + p);
  });

  // gastos
  $('tFij').textContent = ars(t.fij);
  $('tVar').textContent = ars(t.vari);
  renderProg('pFij', t.fijPag, t.fij);
  renderProg('pVar', t.varPag, t.vari);
  renderList('fijos');
  renderList('variables');

  // ahorro
  const tcIn = $('tc');
  if (document.activeElement !== tcIn) tcIn.value = plainNum(view.tc);
  renderSavers();
  const acu = accumulatedUsd();
  $('ahoMesUsd').textContent = usd(t.ahoUsd);
  $('ahoMesArs').textContent = '≈ ' + ars(t.ahoArs);
  $('ahoAcuUsd').textContent = usd(acu);
  $('ahoAcuArs').textContent = view.tc ? `≈ ${ars(acu * view.tc)} al dólar de este mes` : 'Cargá el dólar para ver en pesos';

  justId = null; newId = null;
}

/* ---------- eventos ---------- */
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.dataset.add) {
    e.preventDefault();
    const n = f.n.value.trim(), m = parseAmt(f.m.value);
    if (!n && !f.m.value) { f.n.focus(); return; }
    if (!n) { f.n.focus(); shake(f); return; }
    if (!(m >= 0)) { f.m.focus(); shake(f); return; }
    addItem(f.dataset.add, n, m);
    f.reset();
    f.n.focus();
  } else if (f.dataset.edit) {
    e.preventDefault();
    const n = f.n.value.trim(), m = parseAmt(f.m.value);
    if (!n || !(m >= 0)) { shake(f); return; }
    updateItem(f.dataset.edit, f.dataset.id, n, m);
  }
});
function shake(f) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }

// Enter en el nombre pasa al monto
document.addEventListener('keydown', e => {
  const t = e.target;
  if (e.key === 'Enter' && t.name === 'n' && t.form && t.form.dataset.add) { e.preventDefault(); t.form.m.focus(); }
  if (e.key === 'Escape' && editing) { editing = null; render(); }
  if (e.key === 'Escape' && savingEdit) { savingEdit = null; renderSavers(); }
  if (e.key === 'Enter' && t.dataset.sin) t.blur();
});

document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const row = b.closest('[data-path]');
  if (row && b.hasAttribute('data-tick')) return toggleItem(row.dataset.path, row.dataset.id);
  if (row && b.hasAttribute('data-open')) { editing = { path: row.dataset.path, id: row.dataset.id }; return render(); }
  if (b.hasAttribute('data-del')) { const f = b.closest('form'); return deleteItem(f.dataset.edit, f.dataset.id); }
  if (b.dataset.sedit) { savingEdit = b.dataset.sedit; return renderSavers(); }
  if (b.dataset.cur) {
    const p = b.closest('.saver').dataset.s;
    if (view.ahorro[p].cur !== b.dataset.cur) { view.ahorro[p].cur = b.dataset.cur; commit(); }
  }
});

// Guardar ahorro al salir del campo
document.addEventListener('focusout', e => {
  const t = e.target;
  if (t.dataset && t.dataset.sin) {
    const p = t.dataset.sin, v = t.value.trim() === '' ? 0 : parseAmt(t.value);
    savingEdit = null;
    if (v >= 0 && v !== view.ahorro[p].m) { view.ahorro[p].m = v; commit(); }
    else renderSavers();
  }
});

$('tc').addEventListener('change', e => {
  const v = e.target.value.trim() === '' ? 0 : parseAmt(e.target.value);
  if (v >= 0) { view.tc = v; commit(); } else e.target.value = plainNum(view.tc);
});
$('tc').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });

$('prevM').onclick = () => openMonth(shiftKey(curKey, -1));
$('nextM').onclick = () => openMonth(shiftKey(curKey, 1));
$('todayBtn').onclick = () => openMonth(TODAY);

/* ---------- barra compacta ---------- */
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([en]) => $('mini').classList.toggle('show', !en.isIntersecting && en.boundingClientRect.top < 0))
    .observe($('summary'));
}

/* ---------- tema ---------- */
function applyTheme() {
  const r = document.documentElement;
  if (S.meta.theme === 'light' || S.meta.theme === 'dark') r.dataset.theme = S.meta.theme; else delete r.dataset.theme;
  const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $('themeBtn').textContent = dark ? '☀' : '☾';
}
$('themeBtn').onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  S.meta.theme = dark ? 'light' : 'dark';
  save(); applyTheme();
};

/* ---------- ajustes y respaldo ---------- */
function backupInfo() {
  const lb = S.meta.lastBackup;
  $('backupInfo').textContent = lb
    ? 'Último respaldo: ' + new Date(lb).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Todavía no exportaste ningún respaldo.';
}
$('setBtn').onclick = () => { $('metaPct').value = S.meta.metaPct; backupInfo(); $('settings').showModal(); };
$('settings').addEventListener('click', e => { if (e.target === $('settings')) $('settings').close(); });
$('metaPct').addEventListener('change', e => {
  const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
  e.target.value = v; S.meta.metaPct = v; save(); render();
});

$('exportBtn').onclick = () => {
  S.meta.lastBackup = new Date().toISOString();
  save();
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hogar-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  backupInfo();
  toast('Respaldo descargado');
};
$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.months !== 'object') throw new Error('formato');
    const n = Object.keys(data.months).length;
    if (!confirm(`Este respaldo tiene ${n} mes${n === 1 ? '' : 'es'}. Va a reemplazar los datos actuales de este dispositivo. ¿Seguimos?`)) return;
    const snapshot = JSON.stringify(S);
    data.meta = Object.assign(emptyState().meta, data.meta);
    S = data; save(); applyTheme();
    $('settings').close();
    openMonth(curKey);
    toast('Respaldo importado', () => { S = JSON.parse(snapshot); save(); applyTheme(); openMonth(curKey); });
  } catch (err) {
    alert('No pude leer ese archivo. Tiene que ser un respaldo exportado desde este panel (.json).');
  }
};

/* ---------- aviso con deshacer ---------- */
let toastTimer;
function toast(msg, undo) {
  $('toastTxt').textContent = msg;
  const b = $('toastBtn');
  b.hidden = !undo;
  b.onclick = () => { undo(); $('toast').classList.remove('show'); };
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), undo ? 5000 : 2500);
}

/* ---------- inicio ---------- */
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
openMonth(TODAY);
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
