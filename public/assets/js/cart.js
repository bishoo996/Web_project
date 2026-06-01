/**
 * cart.js — Shopping Cart page logic
 * NEW FILE — does not modify any existing file.
 * Uses /api/cart/* endpoints defined in newRoutes.js.
 */

// ── State ─────────────────────────────────────────────────────────────────────
let cartData    = { items: [], total: 0 };
let isLoggedIn  = false;
let taxRate     = 0.08;   // 8% estimated tax

const REQUIRED_BUILD_CATEGORIES = ['cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu', 'case', 'cooler'];
const REQUIRED_CORE_CATEGORIES = ['cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu'];
const REQUIRED_CORE_LABELS = {
    cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard',
    memory: 'Memory', storage: 'Storage', psu: 'Power Supply'
};

function getCartCategories() {
    return new Set((cartData.items || []).map(item => String(item.category || '').toLowerCase()));
}

function isBuildOrder(categories) {
    return REQUIRED_BUILD_CATEGORIES.some(cat => categories.has(cat));
}

function isBuilderFlowCart() {
    return sessionStorage.getItem('builderFlowCart') === 'true';
}

function getMissingBuildComponents(categories) {
    return REQUIRED_CORE_CATEGORIES.filter(cat => !categories.has(cat));
}

function formatMissingBuildComponents(categories) {
    return getMissingBuildComponents(categories).map(id => REQUIRED_CORE_LABELS[id] || id);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await initCart();
    initCheckoutModal();
});

async function initCart() {
    // Check auth
    try {
        const res  = await fetch('/api/me');
        const data = await res.json();
        isLoggedIn = !!data.isLoggedIn;
    } catch (err) { console.error('Error checking auth state', err); isLoggedIn = false; }

    if (!isLoggedIn) {
        // Show auth banner, hide summary
        showEl('cartAuthBanner');
        renderEmptyCart('Sign in to view and save your cart.');
        return;
    }

    await fetchAndRender();
}

// ── Fetch cart from API and render ────────────────────────────────────────────
async function fetchAndRender() {
    try {
        const res = await fetch('/api/cart');
        if (!res.ok) throw new Error('fetch failed');
        cartData = await res.json();
    } catch (err) {
        console.error('Failed to fetch cart data', err);
        cartData = { items: [], total: 0 };
    }
    renderCart();
}

// ── Main render ───────────────────────────────────────────────────────────────
function renderCart() {
    const itemsCol   = document.getElementById('cartItemsCol');
    const summaryCol = document.getElementById('cartSummaryCol');
    const badgeEl    = document.getElementById('cartCountBadge');

    const items     = cartData.items || [];
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    if (badgeEl) badgeEl.textContent = itemCount;
    // Also update the nav badge
    if (window.updateCartBadge) window.updateCartBadge(itemCount);

    if (items.length === 0) {
        summaryCol.style.display = 'none';
        renderEmptyCart();
        sessionStorage.removeItem('builderFlowCart');
        return;
    }

    summaryCol.style.display = '';

    // Header row
    const headerHTML = `
        <div class="cart-header-row">
            <div>Product</div>
            <div style="text-align:center;">Quantity</div>
            <div style="text-align:center;">Price</div>
            <div></div>
        </div>
    `;

    // Items
    const itemsHTML = items.map(item => renderCartItem(item)).join('');

    // Actions bar
    const actionsHTML = `
        <div class="cart-actions-bar">
            <button class="btn-clear-cart" onclick="clearCart()"><span class="material-icons icon-inline" aria-hidden="true">delete</span> Clear Cart</button>
            <a class="btn-continue-shopping" href="./category.html">← Continue Shopping</a>
        </div>
    `;

    itemsCol.innerHTML = headerHTML + itemsHTML + actionsHTML;

    // Summary
    updateSummary(items);
}

function renderCartItem(item) {
    const productId = item.productId?._id || item.productId;
    const subtotal  = (item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const each      = item.price.toLocaleString('en-US', { minimumFractionDigits: 2 });

    return `
        <div class="cart-item" id="cart-item-${productId}">
            <!-- Product cell -->
            <div class="cart-product-cell">
                <div class="cart-product-img-ph">${renderIcon(getCategoryIcon(item.category))}</div>
                <div class="cart-product-info">
                    <div class="cart-product-brand">${escHtml(item.manufacturer || '')}</div>
                    <div class="cart-product-name">${escHtml(item.title)}</div>
                    <div class="cart-product-cat">${escHtml(item.category || '')}</div>
                </div>
            </div>

            <!-- Quantity -->
            <div class="cart-qty-cell">
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQty('${productId}', ${item.quantity - 1})">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQty('${productId}', ${item.quantity + 1})">+</button>
                </div>
            </div>

            <!-- Price -->
            <div class="cart-price-cell">
                $${subtotal}
                <div class="cart-price-each">$${each} each</div>
            </div>

            <!-- Remove -->
            <div class="cart-remove-cell">
                <button class="cart-remove-btn" title="Remove item" onclick="removeItem('${productId}')">✕</button>
            </div>
        </div>
    `;
}

function renderEmptyCart(message = '') {
    const itemsCol = document.getElementById('cartItemsCol');
    itemsCol.innerHTML = `
        <div class="cart-empty">
            <div class="empty-icon material-icons" aria-hidden="true">shopping_cart</div>
            <h3>Your cart is empty</h3>
            <p>${message || 'Looks like you haven\'t added anything yet.'}</p>
            <a href="./category.html" class="btn-primary" style="text-decoration:none;display:inline-block;padding:12px 28px;">Browse Products</a>
        </div>
    `;
    const badgeEl = document.getElementById('cartCountBadge');
    if (badgeEl) badgeEl.textContent = '0';
    if (window.updateCartBadge) window.updateCartBadge(0);
}

function updateSummary(items) {
    const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax       = subtotal * taxRate;
    const shipping  = subtotal > 500 ? 0 : 29.99;
    const total     = subtotal + tax + shipping;
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    setEl('summaryItemCount', itemCount);
    setEl('summarySubtotal', '$' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    setEl('summaryTax',      '$' + tax.toLocaleString('en-US',      { minimumFractionDigits: 2 }));
    setEl('summaryTotal',    '$' + total.toLocaleString('en-US',    { minimumFractionDigits: 2 }));
    setEl('summaryShipping', subtotal > 500 ? 'Free' : '$29.99');
}

// ── Cart actions ──────────────────────────────────────────────────────────────
async function changeQty(productId, newQty) {
    if (newQty < 1) {
        removeItem(productId);
        return;
    }

    try {
        const res = await fetch(`/api/cart/item/${productId}`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ quantity: newQty })
        });
        if (!res.ok) throw new Error('update failed');
        await fetchAndRender();
    } catch (err) {
        console.error('Failed to update quantity', err);
        showToast('Failed to update quantity', 'error');
    }
}

async function removeItem(productId) {
    // Optimistic: fade out
    const el = document.getElementById(`cart-item-${productId}`);
    if (el) {
        el.style.transition = 'opacity 0.25s, transform 0.25s';
        el.style.opacity    = '0';
        el.style.transform  = 'translateX(-20px)';
    }

    try {
        await fetch(`/api/cart/item/${productId}`, { method: 'DELETE' });
        
        // Sync removal with builder if part exists
        try {
            const parts = JSON.parse(sessionStorage.getItem('builderParts') || '{}');
            let removed = false;
            Object.keys(parts).forEach(key => {
                if (parts[key].productId === productId) {
                    delete parts[key];
                    removed = true;
                }
            });
            if (removed) {
                sessionStorage.setItem('builderParts', JSON.stringify(parts));
            }
        } catch (err) {
            console.error('Failed to sync builder removal', err);
        }
        
        await fetchAndRender();
        showToast('Item removed from cart', 'success');
    } catch (err) {
        console.error('Failed to remove item', err);
        showToast('Failed to remove item', 'error');
        await fetchAndRender();   // re-render to restore
    }
}

async function clearCart() {
    if (!confirm('Remove all items from your cart?')) return;
    try {
        await fetch('/api/cart', { method: 'DELETE' });
        cartData = { items: [], total: 0 };
        renderCart();
        showToast('Cart cleared', 'success');
    } catch (err) {
        console.error('Failed to clear cart', err);
        showToast('Failed to clear cart', 'error');
    }
}

// ── Checkout modal ────────────────────────────────────────────────────────────
function initCheckoutModal() {
    const checkoutBtn     = document.getElementById('checkoutBtn');
    const modal           = document.getElementById('checkoutModal');
    const cancelBtn       = document.getElementById('checkoutModalCancel');
    const confirmBtn      = document.getElementById('checkoutModalConfirm');

    if (!checkoutBtn || !modal) return;

    checkoutBtn.addEventListener('click', () => {
        if (!isLoggedIn) {
            window.location.href = './sign_in.html';
            return;
        }
        if (!cartData.items || cartData.items.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }

        const categories = getCartCategories();
        const missing = formatMissingBuildComponents(categories);
        if (isBuilderFlowCart() && isBuildOrder(categories) && missing.length > 0) {
            showBuildWarning(missing);
            return;
        }

        // Pre-fill address if user has one stored
        modal.classList.add('show');
    });

    cancelBtn?.addEventListener('click', () => modal.classList.remove('show'));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    const buildWarningOverlay = document.getElementById('buildWarningOverlay');
    const buildWarningCancel = document.getElementById('buildWarningCancel');
    const buildWarningConfirm = document.getElementById('buildWarningConfirm');
    const buildWarningList = document.getElementById('buildWarningList');

    const hideBuildWarning = () => buildWarningOverlay?.classList.remove('show');
    const showBuildWarning = (missing) => {
        if (!buildWarningOverlay || !buildWarningList) return;
        buildWarningList.innerHTML = missing.map(part => `<li>${part}</li>`).join('');
        buildWarningOverlay.classList.add('show');
    };

    buildWarningCancel?.addEventListener('click', () => hideBuildWarning());
    buildWarningOverlay?.addEventListener('click', (e) => {
        if (e.target === buildWarningOverlay) hideBuildWarning();
    });

    buildWarningConfirm?.addEventListener('click', () => {
        hideBuildWarning();
        modal.classList.add('show');
    });

    confirmBtn?.addEventListener('click', async () => {
        const address       = document.getElementById('checkoutAddress')?.value || '';
        const paymentMethod = document.getElementById('checkoutPayment')?.value || 'card';
        const notes         = document.getElementById('checkoutNotes')?.value || '';

        confirmBtn.disabled    = true;
        confirmBtn.textContent = 'Placing Order…';

        try {
            const res = await fetch('/api/cart/checkout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ shippingAddress: address, paymentMethod, notes })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast(data.error || 'Checkout failed', 'error');
                confirmBtn.disabled    = false;
                confirmBtn.textContent = 'Place Order';
                return;
            }

            modal.classList.remove('show');
            document.getElementById('orderSuccessOverlay')?.classList.add('show');

            // Clear local cart state
            cartData = { items: [], total: 0 };
            if (window.updateCartBadge) window.updateCartBadge(0);
            sessionStorage.removeItem('builderFlowCart');
        } catch (err) {
            showToast('Checkout failed. Please try again.', 'error');
        } finally {
            confirmBtn.disabled    = false;
            confirmBtn.textContent = 'Place Order';
        }
    });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('cartToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className   = `cart-toast show ${type}`;
    setTimeout(() => { toast.className = 'cart-toast'; }, 3200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderIcon(iconName) {
    return `<span class="material-icons icon-inline" aria-hidden="true">${iconName}</span>`;
}

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}

function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getCategoryIcon(cat) {
    const map = {
        cpu: 'memory',
        gpu: 'sports_esports',
        ram: 'memory',
        storage: 'storage',
        motherboard: 'settings_input_component',
        psu: 'power',
        case: 'desktop_windows',
        cooling: 'ac_unit',
        laptop: 'laptop',
        monitor: 'desktop_mac'
    };
    return map[(cat || '').toLowerCase()] || 'inventory_2';
}

// ── Expose addToCart globally ─────────────────────────────────────────────────
// Other pages (category, product) can call window.addToCart(productId)
window.addToCart = async function(productId, quantity = 1) {
    try {
        const res = await fetch('/api/cart/add', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ productId, quantity })
        });
        const data = await res.json();

        if (res.status === 401) {
            showToast('Please sign in to add items to cart', 'error');
            return false;
        }
        if (!res.ok) {
            showToast(data.error || 'Failed to add to cart', 'error');
            return false;
        }

        if (window.updateCartBadge) window.updateCartBadge(data.itemCount);
        showToast('Added to cart!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to add item to cart', err);
        showToast('Network error', 'error');
        return false;
    }
};
