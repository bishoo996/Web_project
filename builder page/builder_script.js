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


const CORE = [
  { id: 'cpu',         label: 'CPU',           sub: 'Processor',        emoji: '🔲', btn: 'Choose A CPU' },
  { id: 'motherboard', label: 'Motherboard',   sub: 'Main Board',       emoji: '🖥️', btn: 'Choose A Motherboard' },
  { id: 'gpu',         label: 'Video Card',    sub: 'GPU',              emoji: '🎮', btn: 'Choose A Video Card' },
  { id: 'memory',      label: 'Memory',        sub: 'Slot 1',           emoji: '💾', btn: 'Choose Memory' },
  { id: 'storage',     label: 'Storage',       sub: 'SSD / HDD',        emoji: '💿', btn: 'Choose Storage' },
  { id: 'psu',         label: 'Power Supply',  sub: 'PSU',              emoji: '🔌', btn: 'Choose A Power Supply' },
  { id: 'case',        label: 'Case',          sub: 'Enclosure',        emoji: '🗄️', btn: 'Choose A Case' },
  { id: 'cooler',      label: 'CPU Cooler',    sub: 'Thermal Solution', emoji: '❄️', btn: 'Choose A CPU Cooler' },
];

const PERIPH = [
  { id: 'monitor',  label: 'Monitor',  sub: 'Display', emoji: '🖥',  btn: 'Choose A Monitor' },
  { id: 'keyboard', label: 'Keyboard', sub: 'Input',   emoji: '⌨️', btn: 'Choose A Keyboard' },
  { id: 'mouse',    label: 'Mouse',    sub: 'Input',   emoji: '🖱️', btn: 'Choose A Mouse' },
  { id: 'headset',  label: 'Headset',  sub: 'Audio',   emoji: '🎧', btn: 'Choose A Headset' },
];


function getParts() { try { return JSON.parse(sessionStorage.getItem('builderParts') || '{}'); } catch { return {}; } }
function saveParts(p) { sessionStorage.setItem('builderParts', JSON.stringify(p)); }


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

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function wattageHTML(watts) {
  if (watts === null || watts === undefined) return '<span class="dash">—</span>';
  const pct = Math.min((watts / 500) * 100, 100);
  const cls = watts < 100 ? 'watt-low' : watts < 250 ? 'watt-mid' : 'watt-high';
  return `<div class="wattage-val"><span>${watts}W</span>
    <div class="wattage-bar-track"><div class="wattage-bar-fill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

function benchHTML(bench) {
  if (!bench) return '<span class="dash">—</span>';
  return `<div class="bench-cell">
    <span class="bench-score bench-${bench.tier}">${bench.score.toLocaleString()}</span>
    <span class="bench-source">${bench.source}</span>
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
  const catUrl = `category.html?category=${compId}&from=builder`;

  let itemsHTML = '';
  if (items.length === 0) {
    itemsHTML = `<div style="padding:14px 16px;font-size:12px;color:var(--text-secondary);text-align:center;">No items yet</div>`;
  } else {
    itemsHTML = items.slice(0, 3).map(item => `
      <a class="preview-item" href="${catUrl}">
        <div class="preview-emoji">${item.emoji || '📦'}</div>
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

function makeRow(comp, parts) {
  const sel     = parts[comp.id];
  const catUrl  = `category.html?category=${comp.id}&from=builder`;
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
      <div class="part-thumb">${sel.emoji || comp.emoji}</div>
      <div class="part-info">
        <div class="part-name">${sel.name}</div>
        <div class="part-specs">${sel.specs || ''}</div>
        ${badges ? `<div class="part-badges">${badges}</div>` : ''}
        <div class="part-actions">
          <a class="action-btn change" href="${catUrl}">✎ Change</a>
          <button class="action-btn remove" data-id="${comp.id}">✕ Remove</button>
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

function makeMemory2Row(parts) {
  const sel    = parts['memory2'];
  const catUrl = `category.html?category=memory2&from=builder`;
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
      <div class="part-thumb sm">${sel.emoji || '💾'}</div>
      <div class="part-info">
        <div class="part-name sm">${sel.name} <span class="badge badge-purple" style="margin-left:4px">Slot 2</span></div>
        <div class="part-specs">${sel.specs || ''}</div>
        ${badges ? `<div class="part-badges">${badges}</div>` : ''}
        <div class="part-actions">
          <a class="action-btn change" href="${catUrl}">✎ Change</a>
          <button class="action-btn remove" data-id="memory2">✕ Remove</button>
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

  const count = Object.keys(parts).length;
  document.getElementById('partsCount').textContent = `${count} Part${count !== 1 ? 's' : ''} Selected`;

const chips = document.getElementById('compatChips');
const hasDual = parts['memory'] && parts['memory2'];

const psu = parts['psu'];
const psuCapacity = psu?.watts ?? null;

const totalWatts = Object.entries(parts)
  .filter(([id]) => id !== 'psu')
  .reduce((sum, [, part]) => sum + (part.watts || 0), 0);

let psuChip = '';
if (psu && psuCapacity) {
  const loadPct = Math.round((totalWatts / psuCapacity) * 100);
  if (loadPct > 100) {
    psuChip = `<span class="chip chip-error">✕ PSU Overloaded · ${totalWatts}W / ${psuCapacity}W (${loadPct}%)</span>`;
  } else if (loadPct >= 80) {
    psuChip = `<span class="chip chip-warn">⚠ PSU Near Limit · ${totalWatts}W / ${psuCapacity}W (${loadPct}%)</span>`;
  } else {
    psuChip = `<span class="chip chip-ok">✓ PSU OK · ${totalWatts}W / ${psuCapacity}W (${loadPct}%)</span>`;
  }
} else if (totalWatts > 0 && !psu) {
  psuChip = `<span class="chip chip-warn">⚠ No PSU · ${totalWatts}W needed</span>`;
}

chips.innerHTML = count === 0
  ? '<span class="chip chip-info">No parts selected</span>'
  : `<span class="chip chip-ok">✓ ${count} Component${count !== 1 ? 's' : ''} Added</span>
     <span class="chip chip-info">ATX Form Factor</span>
     ${hasDual ? '<span class="chip chip-ok">✓ Dual Channel RAM</span>' : ''}
     ${psuChip}`;
  document.querySelectorAll('.action-btn.remove').forEach(btn =>
    btn.addEventListener('click', () => {
      const p    = getParts();
      const name = p[btn.dataset.id]?.name || 'Part';
      delete p[btn.dataset.id];
      if (btn.dataset.id === 'memory') delete p['memory2'];
      saveParts(p); render();
      showToast(`✕ ${name} removed`);
    })
  );

  document.querySelectorAll('[data-toast]').forEach(btn =>
    btn.addEventListener('click', () => showToast(btn.dataset.toast))
  );
}

render();
