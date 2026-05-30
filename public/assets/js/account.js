/**
 * account.js — My Account page logic
 * NEW FILE — does not modify any existing file.
 * All API calls go to /api/account/* and /api/benchmark/history endpoints
 * defined in newRoutes.js.
 */

// ── State ────────────────────────────────────────────────────────────────────
let currentUser = null;
let ordersCache = [];
let reviewsCache = [];

// ── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initSidebarNav();
    initProfileForm();
    initPasswordForm();
    initLogoutButtons();

    // Load overview data eagerly
    await loadProfile();
    await loadOverviewStats();
});

// ── Auth guard ───────────────────────────────────────────────────────────────
async function checkAuth() {
    try {
        const res = await fetch('/api/me');
        if (!res.ok) throw new Error('not ok');
        const data = await res.json();
        if (!data.isLoggedIn) {
            window.location.href = './sign_in.html?redirect=account';
            return;
        }
        currentUser = data;
    } catch {
        window.location.href = './sign_in.html?redirect=account';
    }
}

// ── Sidebar navigation ────────────────────────────────────────────────────────
function initSidebarNav() {
    document.querySelectorAll('.account-nav-item[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);

            // Lazy-load section data
            if (section === 'orders')   loadOrders();
            if (section === 'reviews')  loadReviews();
            if (section === 'wishlist') loadWishlist();
            if (section === 'recent')   loadRecentlyViewed();
        });
    });
}

function switchSection(name) {
    document.querySelectorAll('.account-nav-item[data-section]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.account-section').forEach(s => s.classList.remove('active'));

    const activeBtn = document.querySelector(`.account-nav-item[data-section="${name}"]`);
    const activeSection = document.getElementById(`section-${name}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeSection) activeSection.classList.add('active');
}

// ── Profile load ──────────────────────────────────────────────────────────────
async function loadProfile() {
    try {
        const res = await fetch('/api/account/profile');
        if (!res.ok) return;
        const user = await res.json();
        currentUser = { ...currentUser, ...user };

        // Sidebar
        const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase() || '?';
        setEl('avatarInitials', initials);
        setEl('sidebarName', `${user.firstName || ''} ${user.lastName || ''}`.trim());
        setEl('sidebarEmail', user.email || '');
        setEl('sidebarRole', user.role || 'Customer');

        // Overview info card
        setEl('ovFullName', `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—');
        setEl('ovEmail', user.email || '—');
        setEl('ovPhone', user.phoneNumber || '—', !user.phoneNumber);
        setEl('ovAddress', user.address || '—', !user.address);
        setEl('ovRole', capitalise(user.role) || 'Customer');

        if (user.createdAt) {
            setEl('ovMemberSince', new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }));
        }

        // Pre-fill edit form
        setInputVal('editFirstName', user.firstName || '');
        setInputVal('editLastName', user.lastName || '');
        setInputVal('editEmail', user.email || '');
        setInputVal('editPhone', user.phoneNumber || '');
        setInputVal('editAddress', user.address || '');

    } catch (err) {
        console.error('loadProfile error:', err);
    }
}

// ── Overview stats ────────────────────────────────────────────────────────────
async function loadOverviewStats() {
    try {
        // Orders
        const oRes = await fetch('/api/account/orders');
        if (oRes.ok) {
            ordersCache = await oRes.json();
            setEl('statOrders', ordersCache.length);
            const totalSpent = ordersCache.reduce((s, o) => s + (o.total || 0), 0);
            setEl('statSpent', '$' + totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 }));

            // Last order snapshot
            if (ordersCache.length > 0) {
                renderLastOrderSnap(ordersCache[0]);
            }
        }

        // Reviews count
        const rRes = await fetch('/api/account/reviews');
        if (rRes.ok) {
            reviewsCache = await rRes.json();
            setEl('statReviews', reviewsCache.length);
        }

        // Wishlist count
        const wRes = await fetch('/api/account/wishlist');
        if (wRes.ok) {
            const wishlist = await wRes.json();
            setEl('statWishlist', wishlist.length);
        }

    } catch (err) {
        console.error('loadOverviewStats error:', err);
    }
}

function renderLastOrderSnap(order) {
    const el = document.getElementById('lastOrderSnap');
    if (!el) return;

    const statusClass = `status-${order.status}`;
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const itemsHtml = (order.items || []).slice(0, 3).map(item => `
        <div class="order-item-row">
            <div class="cart-product-img-ph" style="width:36px;height:36px;border-radius:6px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">📦</div>
            <div class="order-item-info">
                <div class="order-item-name">${escHtml(item.title)}</div>
                <div class="order-item-qty">Qty: ${item.quantity}</div>
            </div>
            <div class="order-item-price">$${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
                <div style="font-size:12px;color:var(--text-muted);">Order #${String(order._id).slice(-8).toUpperCase()}</div>
                <div style="font-size:12px;color:var(--text-muted);">${date}</div>
            </div>
            <span class="order-status ${statusClass}">${capitalise(order.status)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">${itemsHtml}</div>
        <div style="display:flex;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);font-size:14px;">
            <span style="color:var(--text-muted);">Order Total</span>
            <span style="color:var(--success-color);font-weight:700;">$${(order.total || 0).toLocaleString()}</span>
        </div>
        <button class="btn-account-ghost" style="margin-top:12px;" onclick="switchSection('orders')">View All Orders →</button>
    `;
}

// ── Orders section ────────────────────────────────────────────────────────────
async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    container.innerHTML = '<div class="skeleton" style="height:120px;border-radius:10px;"></div>';

    try {
        const res = await fetch('/api/account/orders');
        if (!res.ok) throw new Error('Failed');
        ordersCache = await res.json();

        if (ordersCache.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h4>No orders yet</h4>
                    <p>When you complete a purchase, your orders will appear here.</p>
                    <a href="./cart.html" class="btn-account-ghost">Go to Cart</a>
                </div>`;
            return;
        }

        container.innerHTML = ordersCache.map(order => renderOrderCard(order)).join('');

    } catch (err) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Failed to load orders.</p>';
    }
}

function renderOrderCard(order) {
    const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const statusClass = `status-${order.status}`;
    const itemsHtml = (order.items || []).map(item => `
        <div class="order-item-row">
            <div style="width:40px;height:40px;border-radius:6px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📦</div>
            <div class="order-item-info">
                <div class="order-item-name">${escHtml(item.title)}</div>
                <div class="order-item-qty">Qty: ${item.quantity} · ${capitalise(item.category || '')}</div>
            </div>
            <div class="order-item-price">$${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');

    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Order #${String(order._id).slice(-8).toUpperCase()}</div>
                    <div class="order-date">${date}</div>
                    ${order.shippingAddress ? `<div class="order-date" style="margin-top:2px;">📍 ${escHtml(order.shippingAddress)}</div>` : ''}
                </div>
                <span class="order-status ${statusClass}">${capitalise(order.status)}</span>
            </div>
            <div class="order-items-list">${itemsHtml}</div>
            <div class="order-total-row">
                <span class="order-total-label">${order.items.length} item${order.items.length !== 1 ? 's' : ''} · ${capitalise(order.paymentMethod || 'card')}</span>
                <span class="order-total-val">$${(order.total || 0).toLocaleString()}</span>
            </div>
        </div>
    `;
}

// ── Reviews section ───────────────────────────────────────────────────────────
async function loadReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = '<div class="skeleton" style="height:100px;border-radius:10px;"></div>';

    try {
        const res = await fetch('/api/account/reviews');
        if (!res.ok) throw new Error('Failed');
        reviewsCache = await res.json();

        if (reviewsCache.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✍️</div>
                    <h4>No reviews yet</h4>
                    <p>Share your experience on product pages after purchasing.</p>
                </div>`;
            return;
        }

        container.innerHTML = reviewsCache.map(r => renderReviewCard(r)).join('');

    } catch (err) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Failed to load reviews.</p>';
    }
}

function renderReviewCard(review) {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const date = review.date ? new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    return `
        <div class="review-card" id="review-${review.reviewId}">
            <div class="review-product-img-ph" style="width:52px;height:52px;border-radius:8px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;">🖥️</div>
            <div class="review-body">
                <a class="review-product-link" href="./product.html?id=${review.productId}">${escHtml(review.productTitle)}</a>
                <div class="review-title">${escHtml(review.title || '')}</div>
                <div class="review-stars">${stars}</div>
                <div class="review-comment">${escHtml(review.comment || '')}</div>
                <div class="review-meta">${date}</div>
                <div class="review-actions">
                    <button class="btn-account-danger" onclick="deleteReview('${review.productId}', '${review.reviewId}')">
                        🗑 Delete Review
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function deleteReview(productId, reviewId) {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
        const res = await fetch(`/api/account/reviews/${productId}/${reviewId}`, { method: 'DELETE' });
        if (!res.ok) {
            const d = await res.json();
            alert(d.error || 'Failed to delete review');
            return;
        }
        const card = document.getElementById(`review-${reviewId}`);
        if (card) {
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            setTimeout(() => card.remove(), 300);
        }
        // Update overview count
        reviewsCache = reviewsCache.filter(r => r.reviewId !== reviewId);
        setEl('statReviews', reviewsCache.length);
    } catch {
        alert('Failed to delete review.');
    }
}

// ── Wishlist ──────────────────────────────────────────────────────────────────
async function loadWishlist() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;

    container.innerHTML = '<div class="skeleton" style="height:160px;border-radius:10px;"></div>';

    try {
        const res = await fetch('/api/account/wishlist');
        if (!res.ok) throw new Error('Failed');
        const products = await res.json();

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🤍</div>
                    <h4>Your wishlist is empty</h4>
                    <p>Heart products while browsing to save them here.</p>
                    <a href="./category.html" class="btn-account-ghost">Browse Products</a>
                </div>`;
            return;
        }

        setEl('statWishlist', products.length);
        container.innerHTML = `<div class="mini-product-grid">${products.map(p => renderMiniProductCard(p, true)).join('')}</div>`;

    } catch {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Failed to load wishlist.</p>';
    }
}

// ── Recently Viewed ───────────────────────────────────────────────────────────
async function loadRecentlyViewed() {
    const container = document.getElementById('recentContainer');
    if (!container) return;

    container.innerHTML = '<div class="skeleton" style="height:160px;border-radius:10px;"></div>';

    try {
        const res = await fetch('/api/account/recently-viewed');
        if (!res.ok) throw new Error('Failed');
        const products = await res.json();

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👀</div>
                    <h4>Nothing viewed yet</h4>
                    <p>Products you browse will appear here automatically.</p>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="mini-product-grid">${products.map(p => renderMiniProductCard(p)).join('')}</div>`;

    } catch {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Failed to load recently viewed.</p>';
    }
}

function renderMiniProductCard(product, showRemoveWishlist = false) {
    const emoji = getCategoryEmoji(product.category);
    return `
        <a class="mini-product-card" href="./product.html?id=${product._id}">
            <div class="mini-product-img-placeholder">${emoji}</div>
            <div class="mini-product-info">
                <div class="mini-product-brand">${escHtml(product.manufacturer || '')}</div>
                <div class="mini-product-name">${escHtml(product.title)}</div>
                <div class="mini-product-price">$${(product.price || 0).toLocaleString()}</div>
            </div>
        </a>
    `;
}

// ── Profile form ──────────────────────────────────────────────────────────────
function initProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('profileFeedback');
        feedback.className = 'form-feedback';

        const payload = {
            firstName:   document.getElementById('editFirstName').value.trim(),
            lastName:    document.getElementById('editLastName').value.trim(),
            phoneNumber: document.getElementById('editPhone').value.trim(),
            address:     document.getElementById('editAddress').value.trim()
        };

        if (!payload.firstName || !payload.lastName) {
            showFeedback(feedback, 'First name and last name are required.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/account/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                showFeedback(feedback, data.error || 'Failed to save changes.', 'error');
                return;
            }

            showFeedback(feedback, '✅ Profile updated successfully!', 'success');

            // Refresh sidebar + overview
            await loadProfile();

        } catch {
            showFeedback(feedback, 'Network error. Please try again.', 'error');
        }
    });
}

// ── Password form ─────────────────────────────────────────────────────────────
function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('passwordFeedback');

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword     = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showFeedback(feedback, 'New passwords do not match.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showFeedback(feedback, 'New password must be at least 6 characters.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/account/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();

            if (!res.ok) {
                showFeedback(feedback, data.error || 'Failed to update password.', 'error');
                return;
            }

            showFeedback(feedback, '✅ Password updated successfully!', 'success');
            form.reset();

        } catch {
            showFeedback(feedback, 'Network error. Please try again.', 'error');
        }
    });
}

// ── Logout ────────────────────────────────────────────────────────────────────
function initLogoutButtons() {
    ['sidebarLogout', 'dangerLogout'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', async () => {
                try { await fetch('/api/logout', { method: 'POST' }); } catch (_) {}
                window.location.href = './index.html';
            });
        }
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function setEl(id, text, markEmpty = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    if (markEmpty) {
        el.classList.add('empty');
    } else {
        el.classList.remove('empty');
    }
}

function setInputVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function showFeedback(el, message, type) {
    el.textContent = message;
    el.className = `form-feedback ${type}`;
    setTimeout(() => { el.className = 'form-feedback'; }, 5000);
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategoryEmoji(cat) {
    const map = { cpu:'🧠', gpu:'🎮', ram:'💾', storage:'💿', motherboard:'🔌',
                  psu:'⚡', case:'🖥️', cooling:'❄️', laptop:'💻', monitor:'🖥️' };
    return map[(cat || '').toLowerCase()] || '📦';
}

// Expose deleteReview globally for inline onclick
window.deleteReview  = deleteReview;
window.switchSection = switchSection;
