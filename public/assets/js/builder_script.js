const TOP3 = {
  cpu:         [],
  motherboard: [],
  gpu:         [],
  memory:      [],
  memory2:     [],
  storage:     [],
  psu:         [],
  case:        [],
  cooler:      [],
  monitor:     [],
  keyboard:    [],
  mouse:       [],
  headset:     [],
};

const _ICON_MAP = {
  cpu: 'memory', gpu: 'sports_esports', motherboard: 'desktop_windows',
  memory: 'memory', storage: 'storage', psu: 'power', case: 'desktop_windows',
  cooler: 'ac_unit', monitor: 'desktop_mac', keyboard: 'keyboard',
  mouse: 'mouse', headset: 'headset'
};
// Hena byhandl el data el asaseya w by-map kol category lel icon bta3tha 3ashan tZhar fel UI.


async function loadPreviewProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) return;
    const products = await res.json();
    products.forEach(p => {
      const key = p.category;
      if (TOP3[key] && TOP3[key].length < 3) {
        TOP3[key].push({
          name:  p.title,
          specs: (p.specs || []).slice(0, 2).map(s => `${s.k}: ${s.v}`).join(' · '),
          price: `$${p.price.toFixed(2)}`,
          icon:  _ICON_MAP[key] || 'inventory_2',
        });
      }
    });
    TOP3['memory2'] = [...TOP3['memory']];
  } catch (_) {}
  render();
}
// El function de btegeb el products men el server w beta5od awel 3 fel category 3ashan t3redhom fel hover preview.


const CORE = [
  { id: 'cpu',         label: 'CPU',         sub: 'Processor',        icon: 'memory', btn: 'Choose A CPU' },
  { id: 'motherboard', label: 'Motherboard',   sub: 'Main Board',       icon: 'desktop_windows', btn: 'Choose A Motherboard' },
  { id: 'gpu',         label: 'Video Card',    sub: 'GPU',              icon: 'sports_esports', btn: 'Choose A Video Card' },
  { id: 'memory',      label: 'Memory',        sub: 'Slot 1',           icon: 'memory', btn: 'Choose Memory' },
  { id: 'storage',     label: 'Storage',       sub: 'SSD / HDD',        icon: 'storage', btn: 'Choose Storage' },
  { id: 'psu',         label: 'Power Supply',  sub: 'PSU',              icon: 'power', btn: 'Choose A Power Supply' },
  { id: 'case',        label: 'Case',          sub: 'Enclosure',        icon: 'desktop_windows', btn: 'Choose A Case' },
  { id: 'cooler',      label: 'CPU Cooler',    sub: 'Thermal Solution', icon: 'ac_unit', btn: 'Choose A CPU Cooler' },
];

const PERIPH = [
  { id: 'monitor',  label: 'Monitor',  sub: 'Display', icon: 'desktop_mac',  btn: 'Choose A Monitor' },
  { id: 'keyboard', label: 'Keyboard', sub: 'Input',   icon: 'keyboard', btn: 'Choose A Keyboard' },
  { id: 'mouse',    label: 'Mouse',    sub: 'Input',   icon: 'mouse', btn: 'Choose A Mouse' },
  { id: 'headset',  label: 'Headset',  sub: 'Audio',   icon: 'headset', btn: 'Choose A Headset' },
];
// Dol el arrays ely feha asamy el parts el asaseya w el extra (zay el mouse w el keyboard) ely htzhar fel gadwal.


function getParts() { try { return JSON.parse(sessionStorage.getItem('builderParts') || '{}'); } catch { return {}; } }
function saveParts(p) {
  try {
    sessionStorage.setItem('builderParts', JSON.stringify(p));
  } catch (_) {
    showToast('Storage limit reached — some changes may not be saved.');
  }
}
// Dol bygebo w ysayvo el parts ely enta ekhtartha fel browser (sessionStorage) 3ashan matde3sh lma t3ml refresh.


(function applyPending() {
  const raw = sessionStorage.getItem('pendingPart');
  if (!raw) return;
  sessionStorage.removeItem('pendingPart');
  try {
    const { componentId, part } = JSON.parse(raw);
    const p = getParts();
    p[componentId] = part;
    saveParts(p);
  } catch {}
})();
// El block da byshoof law enta dost "Add" 3la part men saf7a tanya, byzawedha 3al cart bta3tak awel ma el saf7a tefta7.


let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
// De bttala3 popup zghyra (toast) t2olak en fe 7aga 7asalt, w btkhtefy b3d 2.4 sec.


function wattageHTML(watts) {
  if (watts === null || watts === undefined) return '<span class="dash">—</span>';
  const pct = Math.min((watts / 500) * 100, 100);
  const cls = watts < 100 ? 'watt-low' : watts < 250 ? 'watt-mid' : 'watt-high';
  return `<div class="wattage-val"><span>${watts}W</span>
    <div class="wattage-bar-track"><div class="wattage-bar-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

function benchHTML(bench) {
  if (!bench || bench.score === undefined || bench.score === null) return '<span class="dash">—</span>';
  const tier   = bench.tier   || 'mid';
  const source = bench.source || '';
  return `<div class="bench-cell">
    <span class="bench-score bench-${tier}">${bench.score.toLocaleString()}</span>
    <span class="bench-source">${source}</span>
  </div>`;
}

function availHTML(avail) {
  if (!avail) return '<span class="dash">—</span>';
  const map = { in: ['avail-in','In Stock'], low: ['avail-low','Low Stock'], out: ['avail-out','Out of Stock'] };
  const [cls, label] = map[avail] || map.in;
  return `<span class="avail-pill ${cls}"><span class="avail-dot"></span>${label}</span>`;
}

function previewCardHTML(compId, label) {
  const items = TOP3[compId] || [];
  const catUrl = `./category.html?category=${compId}&from=builder`;

  let itemsHTML = '';
  if (items.length === 0) {
    itemsHTML = `<div style="padding:14px 16px;font-size:12px;color:var(--text-secondary);text-align:center;">No items yet</div>`;
  } else {
    itemsHTML = items.slice(0, 3).map(item => `
      <a class="preview-item" href="${catUrl}">
        <div class="preview-emoji">${renderIcon(item.icon || 'inventory_2')}</div>
        <div class="preview-info">
          <div class="preview-name">${item.name}</div>
          <div class="preview-specs">${item.specs || ''}</div>
        </div>
        <div class="preview-price">${item.price || ''}</div>
      </a>`).join('');
  }

  return `<div class="preview-card">
    <div class="preview-header">
      <span>Top picks · ${label}</span>
      <span>Hover to preview</span>
    </div>
    ${itemsHTML}
    <a class="preview-footer" href="${catUrl}">View all ${label} →</a>
  </div>`;
}

const plusSVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const cartSVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`;

function renderIcon(iconName) {
  return `<span class="material-icons icon-inline" aria-hidden="true">${iconName}</span>`;
}
// El functions dol homa el modules ely btrsem el HTML bta3 kol column, zay el wattage w el benchmark w el card ely btzhr fel hover.


function makeRow(comp, parts) {
  const sel     = parts[comp.id];
  const catUrl  = `./category.html?category=${comp.id}&from=builder`;
  const tr      = document.createElement('tr');
  tr.id = 'row-' + comp.id;

  const tdCat = document.createElement('td'); tdCat.className = 'col-category';
  tdCat.innerHTML = `<div class="cat-cell">
    <a class="cat-link" href="${catUrl}">${comp.label}</a>
    <span class="cat-sub">${comp.sub}</span>
  </div>`;

  const tdSel   = document.createElement('td'); tdSel.className   = 'col-selection';
  const tdWatt  = document.createElement('td'); tdWatt.className  = 'col-wattage';
  const tdBench = document.createElement('td'); tdBench.className = 'col-bench';
  const tdAvail = document.createElement('td'); tdAvail.className = 'col-avail';
  const tdPrice = document.createElement('td'); tdPrice.className = 'col-price';
  const tdBuy   = document.createElement('td'); tdBuy.className   = 'col-buy';

  if (sel) {
    const badges = (sel.badges||[]).map(b=>`<span class="badge badge-${b.color}">${b.text}</span>`).join('');
    tdSel.innerHTML = `<div class="part-cell">
      <div class="part-thumb">${renderIcon(sel.icon || comp.icon)}</div>
      <div class="part-info">
        <div class="part-name">${sel.name}</div>
        <div class="part-specs">${sel.specs || ''}</div>
        ${badges ? `<div class="part-badges">${badges}</div>` : ''}
        <div class="part-actions">
          <a class="action-btn change" href="${catUrl}">${renderIcon('edit')} Change</a>
          <button class="action-btn remove" data-id="${comp.id}">${renderIcon('close')} Remove</button>
        </div>
      </div>
    </div>`;

    tdWatt.innerHTML  = wattageHTML(sel.watts);
    tdBench.innerHTML = benchHTML(sel.bench);
    tdAvail.innerHTML = availHTML(sel.avail);
    tdPrice.innerHTML = `<div class="price-val">${sel.price || '—'}</div>${sel.deal ? `<div class="price-deal">${sel.deal}</div>` : ''}`;
    tdBuy.innerHTML   = sel.buyLink
      ? `<a href="${sel.buyLink}" class="btn-buy" target="_blank">${cartSVG} Buy</a>`
      : `<button class="btn-buy" data-toast="No retailer link yet">${cartSVG} Buy</button>`;
  } else {

    tdSel.innerHTML = `
      <div class="choose-wrap">
        <a class="btn-choose" href="${catUrl}">${plusSVG} ${comp.btn}</a>
        ${previewCardHTML(comp.id, comp.label)}
      </div>`;

    tdWatt.innerHTML  = '<span class="dash">—</span>';
    tdBench.innerHTML = '<span class="dash">—</span>';
    tdAvail.innerHTML = '<span class="dash">—</span>';
    tdPrice.innerHTML = '<span class="dash">—</span>';
    tdBuy.innerHTML   = '<span class="dash">—</span>';
  }

  [tdCat, tdSel, tdWatt, tdBench, tdAvail, tdPrice, tdBuy].forEach(td => tr.appendChild(td));
  return tr;
}
// Da el builder el asasy ely byrsem kol row fel gadwal; lw ekhtart part byzherha b tfaselha, w lw la2 byseebha fadya be button Choose.


function makeMemory2Row(parts) {
  const sel    = parts['memory2'];
  const catUrl = `./category.html?category=memory2&from=builder`;
  const tr     = document.createElement('tr');
  tr.id = 'row-memory2';
  tr.className = 'slot2-row';

  const tdCat = document.createElement('td'); tdCat.className = 'col-category';
  tdCat.innerHTML = `<div class="cat-cell cat-slot2">
    <a class="cat-link" href="${catUrl}">Memory</a>
    <span class="cat-sub">Slot 2 · Dual Channel</span>
  </div>`;

  const tdSel   = document.createElement('td'); tdSel.className   = 'col-selection';
  const tdWatt  = document.createElement('td'); tdWatt.className  = 'col-wattage';
  const tdBench = document.createElement('td'); tdBench.className = 'col-bench';
  const tdAvail = document.createElement('td'); tdAvail.className = 'col-avail';
  const tdPrice = document.createElement('td'); tdPrice.className = 'col-price';
  const tdBuy   = document.createElement('td'); tdBuy.className   = 'col-buy';

  if (sel) {
    const badges = (sel.badges||[]).map(b=>`<span class="badge badge-${b.color}">${b.text}</span>`).join('');
    tdSel.innerHTML = `<div class="part-cell">
      <div class="part-thumb sm">${renderIcon(sel.icon || 'memory')}</div>
      <div class="part-info">
        <div class="part-name sm">${sel.name} <span class="badge badge-purple" style="margin-left:4px">Slot 2</span></div>
        <div class="part-specs">${sel.specs || ''}</div>
        ${badges ? `<div class="part-badges">${badges}</div>` : ''}
        <div class="part-actions">
          <a class="action-btn change" href="${catUrl}">${renderIcon('edit')} Change</a>
          <button class="action-btn remove" data-id="memory2">${renderIcon('close')} Remove</button>
        </div>
      </div>
    </div>`;
    tdWatt.innerHTML  = wattageHTML(sel.watts);
    tdBench.innerHTML = benchHTML(sel.bench);
    tdAvail.innerHTML = availHTML(sel.avail);
    tdPrice.innerHTML = `<div class="price-val">${sel.price || '—'}</div>`;
    tdBuy.innerHTML   = `<button class="btn-buy" data-toast="No retailer link yet">${cartSVG} Buy</button>`;
  } else {
    tdSel.innerHTML = `
      <div class="choose-wrap">
        <a class="btn-choose-slot2" href="${catUrl}">${plusSVG} Add Second RAM Kit</a>
        ${previewCardHTML('memory2', 'Memory')}
      </div>`;
    tdWatt.innerHTML  = '<span class="dash">—</span>';
    tdBench.innerHTML = '<span class="dash">—</span>';
    tdAvail.innerHTML = '<span class="dash">—</span>';
    tdPrice.innerHTML = '<span class="dash">—</span>';
    tdBuy.innerHTML   = '<span class="dash">—</span>';
  }

  [tdCat, tdSel, tdWatt, tdBench, tdAvail, tdPrice, tdBuy].forEach(td => tr.appendChild(td));
  return tr;
}
// De function makhsosa btrsem slot el RAM el tany bs lw enta already 7atet RAM fe slot 1.


function render() {
  const parts = getParts();
  const cb = document.getElementById('coreBody');
  const pb = document.getElementById('peripheralBody');
  cb.innerHTML = ''; pb.innerHTML = '';

  CORE.forEach(comp => {
    cb.appendChild(makeRow(comp, parts));
    if (comp.id === 'memory' && parts['memory']) {
      cb.appendChild(makeMemory2Row(parts));
    }
  });
  PERIPH.forEach(c => pb.appendChild(makeRow(c, parts)));
// Hena bnbd2 el render (El Store Manager): bymsa7 el gadwal el adeem w byrsem el gadwal el gded block by block, w byZawed el RAM el tanya lw mawgouda.

  const count = Object.keys(parts).length;
  document.getElementById('partsCount').textContent = `${count} Part${count !== 1 ? 's' : ''} Selected`;
// Da by3d enta mkhter kam part fel cart bta3tak w yktbha.

const chips = document.getElementById('compatChips');
const hasDual = parts['memory'] && parts['memory2'];

const psu = parts['psu'];
const psuCapacity = psu?.watts ?? null;

const totalWatts = Object.entries(parts)
  .filter(([id]) => id !== 'psu')
  .reduce((sum, [, part]) => sum + (part.watts || 0), 0);
// Da by7seb el total wattage ely el gehaz m7tago mn gher ma y7seb el power supply nfsaha.

let psuChip = '';
if (psu && psuCapacity > 0) {
  const loadPct = Math.round((totalWatts / psuCapacity) * 100);
  if (loadPct > 100) {
    psuChip = `<span class="chip chip-error">PSU Overloaded · ${totalWatts}W / ${psuCapacity}W (${loadPct}%)</span>`;
  } else if (loadPct >= 80) {
    psuChip = `<span class="chip chip-warn">PSU Near Limit · ${totalWatts}W / ${psuCapacity}W (${loadPct}%)</span>`;
  } else {
    psuChip = `<span class="chip chip-ok">PSU OK · ${totalWatts}W / ${psuCapacity}W (${loadPct}%)</span>`;
  }
} else if (totalWatts > 0 && !psu) {
  psuChip = `<span class="chip chip-warn">No PSU · ${totalWatts}W needed</span>`;
}
// Hena bytsheck law el power supply (PSU) hykfy el wattage wla hayfre23 (overloaded) w yetala3lak warning.

const caseFormFactor = parts['case']?.formFactor || (parts['case'] ? 'ATX' : null);

const cpu  = parts['cpu'];
const mobo = parts['motherboard'];
const ram  = parts['memory'];

let socketChip = '';
if (cpu?.socket && mobo?.socket) {
  const match = cpu.socket.toUpperCase() === mobo.socket.toUpperCase();
  socketChip = match
    ? `<span class="chip chip-ok">Socket · ${cpu.socket}</span>`
    : `<span class="chip chip-error">Socket Mismatch · CPU: ${cpu.socket} / Mobo: ${mobo.socket}</span>`;
}
// Da byshoof law el CPU wl Motherboard yerkabo 3la b3d (nfss el socket) wla fe ghalat (Mismatch).

const refMemType = mobo?.memType || cpu?.memType;
let memTypeChip = '';
if (ram?.memType && refMemType) {
  const match = ram.memType.toUpperCase() === refMemType.toUpperCase();
  memTypeChip = match
    ? `<span class="chip chip-ok">RAM · ${ram.memType}</span>`
    : `<span class="chip chip-error">RAM Type Mismatch · ${ram.memType} vs ${refMemType}</span>`;
}
// Hena nfs el klam bs bytsheck el RAM type (zay DDR4 w DDR5) m3 el Motherboard.

const totalPrice = Object.values(parts).reduce((sum, p) => {
  const n = parseFloat((p?.price || '').replace('$', '').replace(',', ''));
  return isNaN(n) ? sum : sum + n;
}, 0);
const totalEl = document.getElementById('builderTotal');
if (totalEl) totalEl.textContent = totalPrice > 0 ? `· $${totalPrice.toFixed(2)}` : '';
// El cashier: byshel 3lamet el dollar w by7seb el total price bta3 el tegem3a kolha.

chips.innerHTML = count === 0
  ? '<span class="chip chip-info">No parts selected</span>'
  : `<span class="chip chip-ok">${count} Component${count !== 1 ? 's' : ''} Added</span>
     ${caseFormFactor ? `<span class="chip chip-info">${caseFormFactor} Form Factor</span>` : ''}
     ${hasDual ? '<span class="chip chip-ok">Dual Channel RAM</span>' : ''}
     ${socketChip}
     ${memTypeChip}
     ${psuChip}`;
// Da bey7ot kol el warning chips w el success badges ely eshtaghlna 3aleha fo2 fel saf7a mra wa7da.

  document.querySelectorAll('.action-btn.remove').forEach(btn =>
    btn.addEventListener('click', async () => {
      
      const p    = getParts();
      const part = p[btn.dataset.id];
      const name = part?.name || 'Part';
      const productId = part?.productId;
      
      delete p[btn.dataset.id];
      if (btn.dataset.id === 'memory') delete p['memory2'];
      saveParts(p); render();
     //Bygeeb el part ely dost 3aleha w yemsa7ha mn el browser. Law msa7t el RAM el asaseya bymsa7 el RAM el tanya m3aha automatic, w b3den y3ml render 3ashan yeshelha mn el shasha.
      
      
      if (productId) {
        try {
          await fetch(`/api/cart/item/${productId}`, { method: 'DELETE' });
          const cartRes = await fetch('/api/cart/count');
          if (cartRes.ok) {
            const { count } = await cartRes.json();
            if (typeof window.updateCartBadge === 'function') {
              window.updateCartBadge(count);
            }
          }
        } catch (err) {
          console.error('Failed to remove from cart:', err);
        }
      }
      
      showToast(`${name} removed`);
    //Bykallem el server y2olo emsa7 el part de mn el database w mn 7sab el user. B3den bygeeb el raqam el gded bta3 el cart w y-update el icon ely fo2, w ytl3lak el popup (toast) ytamenak enha etmasa7t.
    })
  );

  document.querySelectorAll('[data-toast]').forEach(btn =>
    btn.addEventListener('click', () => showToast(btn.dataset.toast))
  );
}

render();
loadPreviewProducts();
// W fl akher da el ignition: byshghal el render w by7amel el preview products awel ma el website yeftah.