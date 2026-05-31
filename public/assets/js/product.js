// ==========================================
// SINGLE PRODUCT PAGE LOGIC
// ==========================================

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

async function loadProductDetails() {
    if (!productId) {
        document.getElementById('productDetailsContent').innerHTML = '<h1>Product not found.</h1>';
        return;
    }

    try {
        const response = await fetch(`/api/product/${productId}`);
        if (!response.ok) throw new Error('Product not found in database');
        
        const p = await response.json();
        const container = document.getElementById('productDetailsContent');

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

        let stockColor = p.stockStatus === 'in' ? '#10B981' : (p.stockStatus === 'low' ? '#F59E0B' : '#EF4444');
        let stockText = p.stockStatus.toUpperCase() + ' STOCK';
        const imageHTML = p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : `<div style="font-size: 16px; color: var(--text-muted);">No Image Available</div>`;

        // 3. Draw the main product section
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

                <button class="btn-primary btn-large" style="width: 100%; margin-bottom: 10px;" onclick="CartWidget.add('${p._id}');">
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
        document.title = `Overclocked - ${p.title}`;

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

        try {
            await CartWidget.trackView(p._id);
        } catch (err) {
            // ignore
        }

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

loadProductDetails();