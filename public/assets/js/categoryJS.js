// ==========================================
// STOREFRONT FILTER & GRID LOGIC
// ==========================================

let allProducts = []; // Stores the raw database data

async function initStore() {
    try {
        // 1. Fetch EVERYTHING from the new universal product database
        const response = await fetch('/api/products'); 
        allProducts = await response.json();
        
        // 2. Setup the Filters (Checkboxes and Slider)
        setupCategoryFilters();
        setupPriceSlider();
        
        // 3. Render the initial grid
        renderGrid();

    } catch (error) {
        console.error('Failed to load store:', error);
        document.getElementById('productGrid').innerHTML = '<p>Error loading store inventory.</p>';
    }
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
        box.addEventListener('change', renderGrid);
    });
}

function setupPriceSlider() {
    const slider = document.getElementById('priceRange');
    const display = document.getElementById('priceValue');
    
    slider.addEventListener('input', (e) => {
        display.textContent = `$${e.target.value}`;
        renderGrid(); // Redraw grid as you slide
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

    if (filteredProducts.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94A3B8;">No products match your filters.</div>`;
        return;
    }

    // E. Build the Cards
    filteredProducts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Determine stock styling
        let stockClass = 'stock-in';
        let stockText = 'In Stock';
        if (p.stockStatus === 'low') { stockClass = 'stock-low'; stockText = 'Low Stock'; }
        if (p.stockStatus === 'out') { stockClass = 'stock-out'; stockText = 'Out of Stock'; }

        // Determine image (use emoji if no URL)
        const imageHTML = p.imageUrl 
            ? `<img src="${p.imageUrl}" alt="${p.title}" onerror="this.style.display='none'; this.nextElementSibling?.style.display='flex';">` 
            : `<span style="font-size: 50px;">📦</span>`;

        card.innerHTML = `
            <div class="card-img-box">
                ${imageHTML}
                <span style="font-size: 50px; display: none;">📦</span>
            </div>
            <div class="card-brand">${p.manufacturer}</div>
            <div class="card-title">${p.title}</div>
            <div class="card-price">$${p.price.toFixed(2)}</div>
            <div class="card-stock ${stockClass}">${stockText}</div>
            
            <button class="card-btn" onclick="alert('${p.title} added to cart!')">Add to Cart</button>
        `;

        grid.appendChild(card);
    });
}

// --- MOBILE SIDEBAR TOGGLE ---
document.getElementById('mobileFilterBtn')?.addEventListener('click', () => {
    document.getElementById('filterSidebar').classList.add('open');
});
document.getElementById('closeSidebarBtn')?.addEventListener('click', () => {
    document.getElementById('filterSidebar').classList.remove('open');
});

// --- SEARCH & SORT EVENT LISTENERS ---
document.getElementById('searchInput')?.addEventListener('input', renderGrid);
document.getElementById('sortSelect')?.addEventListener('change', renderGrid);

// Start the engine
initStore();