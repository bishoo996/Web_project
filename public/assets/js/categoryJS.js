// ==========================================
// STOREFRONT FILTER & GRID LOGIC
// ==========================================

let allProducts = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 12;

const _urlParams = new URLSearchParams(window.location.search);
const _fromBuilder = _urlParams.get('from') === 'builder';
const _componentId = (_urlParams.get('category') || '').toLowerCase();

// ==========================================
// COMPARE FEATURE
// ==========================================

function getCompareList() {
    try { return JSON.parse(localStorage.getItem('compareList') || '[]'); } catch { return []; }
}

function saveCompareList(list) {
    localStorage.setItem('compareList', JSON.stringify(list));
}

function toggleCompare(productId, productName, productPrice, event) {
    event.stopPropagation();
    const list = getCompareList();
    const idx = list.findIndex(p => p.id === productId);
    if (idx > -1) {
        list.splice(idx, 1);
    } else {
        if (list.length >= 3) {
            showCompareToast('Max 3 products can be compared at once');
            return;
        }
        list.push({ id: productId, name: productName, price: productPrice });
    }
    saveCompareList(list);
    renderCompareBar();
    renderGrid();
}

function clearCompare() {
    saveCompareList([]);
    renderCompareBar();
    renderGrid();
}

function showCompareToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
}

function renderCompareBar() {
    const list = getCompareList();
    let bar = document.getElementById('compareBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'compareBar';
        bar.className = 'compare-bar';
        document.body.appendChild(bar);
    }

    if (list.length === 0) {
        bar.classList.remove('compare-bar-visible');
        return;
    }

    bar.classList.add('compare-bar-visible');

    const slots = [0, 1, 2].map(i => {
        const item = list[i];
        if (item) {
            return `<div class="compare-slot compare-slot-filled">
                <span class="compare-slot-name">${item.name}</span>
                <button class="compare-slot-remove" onclick="toggleCompare('${item.id}','','',event)">×</button>
            </div>`;
        }
        return `<div class="compare-slot compare-slot-empty">+ Add product</div>`;
    }).join('');

    bar.innerHTML = `
        <div class="compare-bar-inner">
            <span class="compare-bar-label">Compare</span>
            <div class="compare-slots">${slots}</div>
            <div class="compare-bar-actions">
                <button class="compare-go-btn" onclick="window.location.href='./compare.html'" ${list.length < 2 ? 'disabled' : ''}>
                    Compare (${list.length}) →
                </button>
                <button class="compare-clear-btn" onclick="clearCompare()">Clear</button>
            </div>
        </div>`;
}

async function initStore() {
    try {
        // 1. Fetch EVERYTHING from the new universal product database
        const response = await fetch('/api/products'); 
        allProducts = await response.json();
        
        // 2. Setup the Filters (Checkboxes and Slider)
        setupCategoryFilters();
        setupPriceSlider();
        
        // 3. Apply URL category filter if present
        applyURLCategoryFilter();
        
        // 4. Render the initial grid
        renderGrid();

    } catch (error) {
        console.error('Failed to load store:', error);
        document.getElementById('productGrid').innerHTML = '<p>Error loading store inventory.</p>';
    }
}

// --- URL PARAMETER HANDLING ---

function applyURLCategoryFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = (urlParams.get('category') || '').toLowerCase();
    if (!categoryParam) return;

    const normalizedCategory = categoryParam === 'memory2' ? 'memory' : categoryParam;

    document.querySelectorAll('.cat-checkbox').forEach(box => {
        box.checked = box.value === normalizedCategory;
    });
}

// --- FILTERING LOGIC ---

function setupCategoryFilters() {
    const container = document.getElementById('categoryFilters');
    
    // Find all unique categories currently in the database
    const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
    
    uniqueCategories.forEach(cat => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" class="cat-checkbox" value="${cat}" checked>
                <span style="text-transform: capitalize;">${cat}</span>
            </label>
        `;
        container.appendChild(div);
    });

    // Add event listeners to redraw grid when clicked
    document.querySelectorAll('.cat-checkbox').forEach(box => {
        box.addEventListener('change', () => { currentPage = 1; renderGrid(); });
    });
}

function setupPriceSlider() {
    const slider = document.getElementById('priceRange');
    const display = document.getElementById('priceValue');
    
    slider.addEventListener('input', (e) => {
        display.textContent = `$${e.target.value}`;
        currentPage = 1;
        renderGrid();
    });
}

// --- HTML RENDERER ---

function renderGrid() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = ''; // Clear current cards

    // A. Gather Active Filters
    const maxPrice = Number(document.getElementById('priceRange').value);
    const activeCategories = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.value);
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortValue = document.getElementById('sortSelect').value;

    // B. Filter the Array
    let filteredProducts = allProducts.filter(p => {
        const matchesCategory = activeCategories.includes(p.category);
        const matchesPrice = p.price <= maxPrice;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm) || 
                              p.manufacturer.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesPrice && matchesSearch;
    });

    // C. Apply Sorting
    if (sortValue === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === 'bench-desc') {
        // If benchmark data exists, sort by it; otherwise keep default
        filteredProducts.sort((a, b) => (b.benchmark || 0) - (a.benchmark || 0));
    } else if (sortValue === 'watt-asc') {
        // If wattage data exists, sort by it
        filteredProducts.sort((a, b) => (a.wattage || 0) - (b.wattage || 0));
    }
    // 'default' keeps original order

    // D. Update count
    const countSpan = document.querySelector('.results-count span');
    if (countSpan) countSpan.textContent = filteredProducts.length;

    const infoEl = document.getElementById('paginationInfo');

    if (filteredProducts.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94A3B8;">No products match your filters.</div>`;
        if (infoEl) infoEl.textContent = '';
        renderPagination(0);
        return;
    }

    // E. Paginate
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    currentPage = Math.min(currentPage, totalPages);
    const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageEnd = Math.min(pageStart + ITEMS_PER_PAGE, filteredProducts.length);
    if (infoEl) infoEl.textContent = `Showing ${pageStart + 1}–${pageEnd} of ${filteredProducts.length} products`;
    filteredProducts = filteredProducts.slice(pageStart, pageEnd);

    // F. Build the Cards
    filteredProducts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer'; // Make it look clickable
        
        // 1. Make the whole card redirect (pass builder context when applicable)
        card.onclick = () => {
            if (_fromBuilder) {
                window.location.href = `product.html?id=${p._id}&from=builder&componentId=${_componentId}`;
            } else {
                window.location.href = `product.html?id=${p._id}`;
            }
        };

        // Determine stock styling
        let stockClass = 'stock-in';
        let stockText = 'In Stock';
        if (p.stockStatus === 'low') { stockClass = 'stock-low'; stockText = 'Low Stock'; }
        if (p.stockStatus === 'out') { stockClass = 'stock-out'; stockText = 'Out of Stock'; }

        const imageHTML = p.imageUrl 
            ? `<img src="${p.imageUrl}" alt="${p.title}">` 
            : `<span style="font-size: 50px;"><span class="material-icons icon-inline" aria-hidden="true">inventory_2</span></span>`;

        // 2. Add stopPropagation to the Add to Cart button
        const isComparing = getCompareList().some(c => c.id === p._id);
        card.innerHTML = `
            <div class="card-img-box">
                ${imageHTML}
            </div>
            <div class="card-brand">${p.manufacturer}</div>
            <div class="card-title">${p.title}</div>
            <div class="card-price">$${p.price.toFixed(2)}</div>
            <div class="card-stock ${stockClass}">${stockText}</div>

            <button class="card-btn" onclick="event.stopPropagation(); ${_fromBuilder ? `CartWidget.addFromBuilder('${p._id}', '${_componentId}', event)` : `CartWidget.add('${p._id}', 1, event)`};">Add to Cart</button>
            <button class="card-compare-btn ${isComparing ? 'comparing' : ''}" onclick="toggleCompare('${p._id}','${p.title.replace(/'/g,"\\'").replace(/"/g,'&quot;')}','$${p.price.toFixed(2)}',event)">
                ${isComparing ? '✓ Comparing' : '+ Compare'}
            </button>
        `;

        grid.appendChild(card);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    let container = document.getElementById('paginationControls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'paginationControls';
        container.className = 'pagination';
        document.getElementById('productGrid').insertAdjacentElement('afterend', container);
    }

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);

    container.innerHTML = `
        <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&#8592; Prev</button>
        ${pages.map(i => `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`).join('')}
        <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next &#8594;</button>
    `;
}

function goToPage(page) {
    currentPage = page;
    renderGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- MOBILE SIDEBAR TOGGLE ---
document.getElementById('mobileFilterBtn')?.addEventListener('click', () => {
    document.getElementById('filterSidebar').classList.add('open');
});
document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
    document.getElementById('filterSidebar').classList.remove('open');
});

// --- SEARCH & SORT EVENT LISTENERS ---
document.getElementById('searchInput')?.addEventListener('input', () => { currentPage = 1; renderGrid(); });
document.getElementById('sortSelect')?.addEventListener('change', () => { currentPage = 1; renderGrid(); });

// Start the engine
renderCompareBar();
initStore();