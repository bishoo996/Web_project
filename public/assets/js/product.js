// ==========================================
// SINGLE PRODUCT PAGE LOGIC
// ==========================================

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
const fromBuilder = params.get('from') === 'builder';
const builderComponentId = params.get('componentId') || '';

const BUILDER_ICON_MAP = {
    cpu: 'memory', gpu: 'sports_esports', motherboard: 'desktop_windows',
    memory: 'memory', memory2: 'memory', storage: 'storage', psu: 'power',
    case: 'desktop_windows', cooler: 'ac_unit', monitor: 'desktop_mac',
    keyboard: 'keyboard', mouse: 'mouse', headset: 'headset'
};
// Hena ben-geeb el data mn el URL (zay el ID w lw gai mn el builder) w ben-zabat map lel icons.

async function loadProductDetails() {
    if (!productId) {
        document.getElementById('productDetailsContent').innerHTML = '<h1>Product not found.</h1>';
        return;
    }
    // Lw mfeesh ID fel URL, bn-wa2af el function w n-tl3 message eno msh mawgood.

    try {
        const response = await fetch(`/api/product/${productId}`);
        if (!response.ok) throw new Error('Product not found in database');
        
        const p = await response.json();
        const container = document.getElementById('productDetailsContent');
        // Hena ben-fetch el product data mn el backend, w ne7awelha JSON 3ashan neshta8al beha.

        // 1. Dynamic Specs
        let specsRows = '';
        if (p.specs && p.specs.length > 0) {
            p.specs.forEach(spec => {
                specsRows += `<tr><td>${spec.k}</td><td>${spec.v}</td></tr>`;
            });
        }

        // 2. Dynamic Review Math!
        let totalScore = 0;
        let avgRating = 0;
        let reviewCount = p.reviews ? p.reviews.length : 0;

        if (reviewCount > 0) {
            p.reviews.forEach(r => totalScore += r.rating);
            avgRating = (totalScore / reviewCount).toFixed(1); // e.g., 4.5
        }
        // Hena 3amalna el rows bta3t el specs table, w e7sabna el average rating bta3 el reviews (total / count).

        let stockColor = p.stockStatus === 'in' ? '#10B981' : (p.stockStatus === 'low' ? '#F59E0B' : '#EF4444');
        let stockText = p.stockStatus.toUpperCase() + ' STOCK';
        const imageHTML = p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : `<div style="font-size: 16px; color: var(--text-muted);">No Image Available</div>`;
        // Ben-zabat el alwan bta3t el stock (a5dar, asfar, a7mar) w el HTML bta3 soret el product.

        // 3. Draw the main product section
        const addToBuilderHTML = (fromBuilder && builderComponentId) ? `
            <button class="btn-primary btn-large" id="addToBuilderBtn" style="width: 100%; margin-bottom: 10px; background: #059669; border-color: #059669;">
                + Add to Builder
            </button>` : '';

        container.innerHTML = `
            <div class="product-image-large">
                ${imageHTML}
            </div>
            <div class="product-info">
                <div class="product-brand-cat">${p.manufacturer} | ${p.category}</div>
                <h1>${p.title}</h1>

                <div class="reviews">
                    <span style="color: #F59E0B;">★</span> ${avgRating} (${reviewCount} Reviews)
                </div>

                <div class="product-price-large">$${p.price.toFixed(2)}</div>

                <div style="color: ${stockColor}; font-weight: bold; margin-bottom: 24px; font-size: 14px;">
                    ● ${stockText}
                </div>

                ${addToBuilderHTML}
                <button class="btn-primary btn-large" style="width: 100%; margin-bottom: 10px;" onclick="CartWidget.add('${p._id}', 1, event);">
                    Add to Cart
                </button>
                <button id="wishlistButton" class="btn-outline btn-large" style="width: 100%;" type="button">
                    Add to Wishlist
                </button>

                <h3 style="margin-top: 40px; border-bottom: 1px solid #333; padding-bottom: 10px;">Technical Specifications</h3>
                <table class="specs-table">
                    ${specsRows}
                </table>
            </div>
        `;
        // Hena ben-inject el HTML kolo fel page b-data el product (sora, title, price, zrayer el cart w el wishlist, w el specs).

        if (fromBuilder && builderComponentId) {
            document.getElementById('addToBuilderBtn')?.addEventListener('click', () => {
                const wattSpec = (p.specs || []).find(s => {
                    const k = (s.k || '').toLowerCase();
                    return k.includes('tdp') || k.includes('watt') || k.includes('power');
                });
                const rawWatts = wattSpec ? parseInt(wattSpec.v) : null;

                const part = {
                    name: p.title,
                    specs: (p.specs || []).slice(0, 3).map(s => `${s.k}: ${s.v}`).join(' · '),
                    badges: p.badges || [],
                    icon: BUILDER_ICON_MAP[builderComponentId] || BUILDER_ICON_MAP[p.category] || 'inventory_2',
                    watts: (!isNaN(rawWatts) && rawWatts > 0) ? rawWatts : null,
                    bench: null,
                    avail: p.stockStatus || 'in',
                    price: `$${p.price.toFixed(2)}`,
                    formFactor: (p.specs || []).find(s => (s.k || '').toLowerCase().includes('form'))?.v || null
                };

                try {
                    sessionStorage.setItem('pendingPart', JSON.stringify({ componentId: builderComponentId, part }));
                } catch (_) {}
                window.location.href = './builder_index.html';
            });
        }
        document.title = `Overclocked - ${p.title}`;
        // Lw el user da5el y-add el part da lel PC builder, ben-gehaz el object bta3o w ne-save fel sessionStorage, w ne-redirect tany lel builder.

        const wishlistBtn = document.getElementById('wishlistButton');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => CartWidget.toggleWishlist(p._id, wishlistBtn));

            try {
                const meRes = await fetch('/api/me');
                if (meRes.ok) {
                    const me = await meRes.json();
                    if (me.isLoggedIn) {
                        const wRes = await fetch('/api/account/wishlist');
                        if (wRes.ok) {
                            const wishlist = await wRes.json();
                            const inWishlist = wishlist.some(item => String(item._id) === String(p._id));
                            wishlistBtn.textContent = inWishlist ? '❤️ Remove from Wishlist' : 'Add to Wishlist';
                            wishlistBtn.title = inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
                        }
                    }
                }
            } catch (err) {
                // ignore
            }
        }
        // Ben-check lw el user 3amel login w 7atet el product da fel wishlist abl kda 3ashan ne-update shakl zorar el wishlist.

        try {
            await CartWidget.trackView(p._id);
        } catch (err) {
            // ignore
        }
        // Ben-eb3at lel server en el user fata7 el product da 3ashan yet7eseb fel "Recently Viewed".

        // 4. Draw the Reviews List at the bottom
        const reviewsContainer = document.getElementById('reviewsList');
        reviewsContainer.innerHTML = '';

        if (reviewCount === 0) {
            reviewsContainer.innerHTML = '<p style="color: var(--text-muted);">No reviews yet. Be the first to review this product!</p>';
        } else {
            // Reverse the array so the newest reviews show up at the top
            [...p.reviews].reverse().forEach(r => {
                const dateString = new Date(r.date).toLocaleDateString();
                const stars = '⭐'.repeat(r.rating);
                
                reviewsContainer.innerHTML += `
                    <div style="background: var(--bg-color); padding: 20px; border-radius: 8px; border: 1px solid #333;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="font-size: 12px; letter-spacing: 2px;">${stars}</span>
                            <span style="font-size: 12px; color: var(--text-muted);">${dateString}</span>
                        </div>
                        <h4 style="margin-bottom: 5px; color: var(--text-primary);">${r.title}</h4>
                        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">"${r.comment}"</p>
                        <div style="font-size: 12px; color: var(--primary-color); font-weight: bold;">- ${r.author}</div>
                    </div>
                `;
            });
        }
        // Ben-lff 3ala el reviews w ne-ersmha fl a5er. Ben-e3kes el array bel reverse 3ashan a5er review yezhar fo2 awel wa7ed.

    } catch (error) {
        console.error('Failed to load product details:', error);
    }
}

// 5. Handle the Review Form Submission
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('reviewMessage');
    
    const payload = {
        rating: document.getElementById('reviewRating').value,
        title: document.getElementById('reviewTitle').value,
        comment: document.getElementById('reviewComment').value
    };

    try {
        const response = await fetch(`/api/product/${productId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            msgDiv.style.color = '#10B981';
            msgDiv.innerText = 'Review posted!';
            document.getElementById('reviewForm').reset();
            
            // Reload the page silently to show the new review and update math!
            loadProductDetails(); 
        } else {
            msgDiv.style.color = '#EF4444';
            msgDiv.innerText = 'Error posting review.';
        }
    } catch (error) {
        msgDiv.style.color = '#EF4444';
        msgDiv.innerText = 'Network error.';
    }
});
// Lma el user ydoos submit lel review, ben-eb3at el data (rating w text) lel backend b-POST request, w lw tamaam b-ne-reload el page silently 3ashan nwareeh el review bta3o w ne-update el math.

loadProductDetails();