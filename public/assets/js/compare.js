async function initComparePage() {
    const list = JSON.parse(localStorage.getItem('compareList') || '[]');
    const content = document.getElementById('compareContent');

    if (list.length < 2) {
        content.innerHTML = `
            <div class="compare-empty">
                <span class="material-icons" style="font-size:64px;color:rgba(124,58,237,0.3);display:block;margin-bottom:16px;">compare</span>
                <h2>Nothing to compare yet</h2>
                <p>Go to the category page, click "+ Compare" on at least 2 products, then hit Compare.</p>
                <a href="./category.html" class="btn-browse">Browse Products</a>
            </div>`;
        return;
    }

    content.innerHTML = `<p class="compare-loading">Loading comparison…</p>`;

    const results = await Promise.all(
        list.map(item =>
            fetch(`/api/product/${item.id}`)
                .then(r => r.ok ? r.json() : null)
                .catch(() => null)
        )
    );

    const products = results.filter(Boolean);

    if (products.length < 2) {
        content.innerHTML = `
            <div class="compare-empty">
                <h2>Products unavailable</h2>
                <p>Some products could not be loaded. Please re-select them from the category page.</p>
                <a href="./category.html" class="btn-browse">Browse Products</a>
            </div>`;
        return;
    }

    // Union of all spec keys across every product
    const allSpecKeys = [...new Set(products.flatMap(p => (p.specs || []).map(s => s.k)))];

    // ── Helpers ──────────────────────────────────────────────────────────────

    function avgRating(p) {
        const reviews = p.reviews || [];
        if (!reviews.length) return null;
        return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    }

    function starsHTML(rating) {
        if (rating === null) return `<span class="no-reviews">No reviews</span>`;
        const full = Math.round(Number(rating));
        return `<span class="stars">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span><span class="rating-num">${rating}</span>`;
    }

    function stockPill(status) {
        const map = { in: ['pill-in','In Stock'], low: ['pill-low','Low Stock'], out: ['pill-out','Out of Stock'] };
        const [cls, label] = map[status] || map.in;
        return `<span class="stock-pill ${cls}">${label}</span>`;
    }

    function getSpec(p, key) {
        const s = (p.specs || []).find(s => s.k === key);
        return s ? s.v : null;
    }

    function makeRow(label, cells, rowClass = '') {
        return `<tr class="${rowClass}">
            <td class="row-label">${label}</td>
            ${cells.map(c => `<td>${c}</td>`).join('')}
        </tr>`;
    }

    // ── Derived values ────────────────────────────────────────────────────────

    const lowestPrice = Math.min(...products.map(p => p.price));
    const ratings     = products.map(avgRating);
    const numRatings  = ratings.map(r => r !== null ? Number(r) : -1);
    const bestRating  = Math.max(...numRatings);

    // ── Product header cells ──────────────────────────────────────────────────

    const headerCells = products.map(p => {
        const imgHTML = p.imageUrl
            ? `<img class="cmp-img" src="${p.imageUrl}" alt="${p.title}" onerror="this.style.display='none'">`
            : `<div class="cmp-img cmp-img-fallback"><span class="material-icons">inventory_2</span></div>`;
        return `${imgHTML}
            <div class="cmp-name">${p.title}</div>
            <div class="cmp-brand">${p.manufacturer}</div>
            <button class="cmp-remove-btn" onclick="removeProduct('${p._id}')">✕ Remove</button>`;
    });

    // ── Fixed rows ────────────────────────────────────────────────────────────

    const priceCells = products.map(p => {
        const isBest = p.price === lowestPrice && products.filter(x => x.price === lowestPrice).length < products.length;
        return `<span class="cmp-price${isBest ? ' best-val' : ''}">$${p.price.toFixed(2)}</span>${isBest ? '<span class="best-badge">Best Price</span>' : ''}`;
    });

    const catCells = products.map(p =>
        `<span style="text-transform:capitalize">${p.category}</span>`
    );

    const stockCells = products.map(p => stockPill(p.stockStatus));

    const ratingCells = products.map((p, i) => {
        const r = ratings[i];
        const isBest = r !== null && Number(r) === bestRating && bestRating > 0
            && numRatings.filter(x => x === bestRating).length < numRatings.length;
        return `<span class="${isBest ? 'best-val' : ''}">${starsHTML(r)}</span>`;
    });

    // ── Spec rows ─────────────────────────────────────────────────────────────

    const specRows = allSpecKeys.map(key => {
        const values = products.map(p => getSpec(p, key));
        const nums   = values.map(v => v !== null ? parseFloat(v) : NaN);
        const allNum = nums.every(n => !isNaN(n)) && values.some(v => v !== null);
        const maxNum = allNum ? Math.max(...nums) : null;

        const cells = values.map((v, i) => {
            if (v === null) return '<span class="dash">—</span>';
            const isBest = allNum && nums[i] === maxNum
                && nums.filter(n => n === maxNum).length < nums.length;
            return `<span class="${isBest ? 'best-val' : ''}">${v}</span>`;
        });
        return makeRow(key, cells, 'spec-row');
    });

    // ── Cart row ──────────────────────────────────────────────────────────────

    const cartCells = products.map(p => {
        const disabled = p.stockStatus === 'out';
        return `<button class="cmp-cart-btn" ${disabled ? 'disabled' : ''}
            onclick="CartWidget.add('${p._id}', 1, event)">
            ${disabled ? 'Out of Stock' : 'Add to Cart'}
        </button>`;
    });

    // ── Assemble ──────────────────────────────────────────────────────────────

    const cols = products.length;

    content.innerHTML = `
        <div class="cmp-table-wrap">
            <table class="cmp-table">
                <thead>
                    <tr>
                        <th class="row-label"></th>
                        ${headerCells.map(c => `<th class="cmp-product-col">${c}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${makeRow('Price',        priceCells,  'row-price')}
                    ${makeRow('Category',     catCells)}
                    ${makeRow('Availability', stockCells)}
                    ${makeRow('Rating',       ratingCells)}
                    ${allSpecKeys.length > 0
                        ? `<tr class="specs-divider"><td class="row-label" colspan="${cols + 1}">Specifications</td></tr>`
                        : ''}
                    ${specRows.join('')}
                    ${makeRow('', cartCells, 'row-cart')}
                </tbody>
            </table>
        </div>
        <p class="cmp-back-link"><a href="./category.html">← Add more products to compare</a></p>`;
}

function removeProduct(productId) {
    const list = JSON.parse(localStorage.getItem('compareList') || '[]');
    localStorage.setItem('compareList', JSON.stringify(list.filter(p => p.id !== productId)));
    initComparePage();
}

initComparePage();
