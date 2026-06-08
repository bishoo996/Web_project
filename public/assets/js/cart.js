/**
 * cart.js — Shopping Cart page logic
 * This script renders the cart page, updates quantities, removes items,
 * calculates totals, and handles checkout interactions.
 * It communicates with the backend via /api/cart/* routes defined in routes/api.js.
 */

// ── State ─────────────────────────────────────────────────────────────────────
// Stores the currently loaded cart items and total values from the API.
let cartData    = { items: [], total: 0 };
// Tracks whether the user is authenticated and allowed to view the cart.
let isLoggedIn  = false;
// Estimated tax rate used in the order summary display.
let taxRate     = 0.08;   // 8% estimated tax

// Required part categories for builder flow validation when placing an order.
const REQUIRED_BUILD_CATEGORIES = ['cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu', 'case', 'cooler'];
const REQUIRED_CORE_CATEGORIES = ['cpu', 'gpu', 'motherboard', 'memory', 'storage', 'psu'];
const REQUIRED_CORE_LABELS = {
    cpu: 'CPU', gpu: 'GPU', motherboard: 'Motherboard',
    memory: 'Memory', storage: 'Storage', psu: 'Power Supply'
};

// ── Helper functions for builder validation and cart state detection ──────
function getCartCategories() {
    // Return a lowercased set of categories present in the current cart.
    return new Set((cartData.items || []).map(item => String(item.category || '').toLowerCase()));
}

function isBuildOrder(categories) {
    // Determine whether the cart contains any required builder components.
    return REQUIRED_BUILD_CATEGORIES.some(cat => categories.has(cat));
}

function isBuilderFlowCart() {
    // Detect whether this checkout flow originated from the builder workflow.
    return sessionStorage.getItem('builderFlowCart') === 'true';
}

function getMissingBuildComponents(categories) {
    // Return required core components that are still missing from the cart.
    return REQUIRED_CORE_CATEGORIES.filter(cat => !categories.has(cat));
}

function formatMissingBuildComponents(categories) {
    // Convert missing component IDs into human-readable labels.
    return getMissingBuildComponents(categories).map(id => REQUIRED_CORE_LABELS[id] || id);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
// Wait for the HTML to load before initializing cart and modal behaviors.
document.addEventListener('DOMContentLoaded', async () => {
    await initCart();
    initCheckoutModal();
});

async function initCart() {
    // Check whether the current visitor is authenticated.
    try {
        const res  = await fetch('/api/me');
        const data = await res.json();
        isLoggedIn = !!data.isLoggedIn;
    } catch (err) {
        // If auth check fails, assume guest mode and hide cart details.
        console.error('Error checking auth state', err);
        isLoggedIn = false;
    }

    if (!isLoggedIn) {
        // Show the encourage-login banner and do not render cart items for guests.
        showEl('cartAuthBanner');
        renderEmptyCart('Sign in to view and save your cart.');
        return;
    }

    // If authenticated, retrieve the user's cart and display it.
    await fetchAndRender();
}

// ── Fetch cart from API and render ────────────────────────────────────────────
async function fetchAndRender() {
    try {
        const res = await fetch('/api/cart');
        if (!res.ok) throw new Error('fetch failed');
        cartData = await res.json();
    } catch (err) {
        // If the fetch fails, display an empty cart instead of crashing.
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
    // Also update the global navigation badge if available.
    if (window.updateCartBadge) window.updateCartBadge(itemCount);

    if (items.length === 0) {
        summaryCol.style.display = 'none';
        renderEmptyCart();
        sessionStorage.removeItem('builderFlowCart');
        return;
    }

    summaryCol.style.display = '';

    // Build the table header row and cart item rows as HTML.
    const headerHTML = `
        <div class="cart-header-row">
            <div>Product</div>
            <div style="text-align:center;">Quantity</div>
            <div style="text-align:center;">Price</div>
            <div></div>
        </div>
    `;

    // Render each cart item using the helper function.
    const itemsHTML = items.map(item => renderCartItem(item)).join('');

    // Render the cart actions section below the items list.
    const actionsHTML = `
        <div class="cart-actions-bar">
            <button class="btn-clear-cart" onclick="clearCart()"><span class="material-icons icon-inline" aria-hidden="true">delete</span> Clear Cart</button>
            <a class="btn-continue-shopping" href="./category.html">← Continue Shopping</a>
        </div>
    `;

    itemsCol.innerHTML = headerHTML + itemsHTML + actionsHTML;

    // Update the order summary column based on the current items.
    updateSummary(items);
}

function renderCartItem(item) {
    const productId = item.productId?._id || item.productId;
    const subtotal  = (item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const each      = item.price.toLocaleString('en-US', { minimumFractionDigits: 2 });

    // Build the HTML for a single cart item row.
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

            <!-- Quantity controls -->
            <div class="cart-qty-cell">
                <div class="qty-control">
                    <button class="qty-btn" onclick="changeQty('${productId}', ${item.quantity - 1})">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQty('${productId}', ${item.quantity + 1})">+</button>
                </div>
            </div>

            <!-- Price display -->
            <div class="cart-price-cell">
                $${subtotal}
                <div class="cart-price-each">$${each} each</div>
            </div>

            <!-- Remove action -->
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
    // Compute the summary values that are displayed on the right-hand panel.
    const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax       = subtotal * taxRate;
    const shipping  = subtotal > 500 ? 0 : 29.99;
    const total     = subtotal + tax + shipping;
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);

    // Update the DOM fields with formatted currency values.
    setEl('summaryItemCount', itemCount);
    setEl('summarySubtotal', '$' + subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    setEl('summaryTax',      '$' + tax.toLocaleString('en-US',      { minimumFractionDigits: 2 }));
    setEl('summaryTotal',    '$' + total.toLocaleString('en-US',    { minimumFractionDigits: 2 }));
    setEl('summaryShipping', subtotal > 500 ? 'Free' : '$29.99');
}

// ── Cart actions ──────────────────────────────────────────────────────────────
async function changeQty(productId, newQty) {
    // If quantity falls below 1, treat the action as a remove request.
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
    // Fade out the removed item immediately for better UX.
    const el = document.getElementById(`cart-item-${productId}`);
    if (el) {
        el.style.transition = 'opacity 0.25s, transform 0.25s';
        el.style.opacity    = '0';
        el.style.transform  = 'translateX(-20px)';
    }

    try {
        await fetch(`/api/cart/item/${productId}`, { method: 'DELETE' });
        
        // If the cart is part of a builder flow, keep session builder state in sync.
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
        await fetchAndRender();   // re-render to restore state after failure.
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

        // Open the checkout modal after all validations pass.
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

    // Helper functions for the build warning dialog that appears when essential parts are missing.
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
// Render a temporary message box on the cart page.
function showToast(message, type = 'success') {
    const toast = document.getElementById('cartToast');
    if (!toast) return;
    toast.textContent = message;
    toast.className   = `cart-toast show ${type}`;
    setTimeout(() => { toast.className = 'cart-toast'; }, 3200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// Render a Material icon inside an inline span.
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
    // Escape HTML entities before inserting strings into generated HTML.
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getCategoryIcon(cat) {
    // Choose a Material icon name based on the product category.
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
// Other pages (category, product) can call `window.addToCart(productId)` to add items.
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

        // Update any cart badge displayed in the navigation bar.
        if (window.updateCartBadge) window.updateCartBadge(data.itemCount);
        showToast('Added to cart!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to add item to cart', err);
        showToast('Network error', 'error');
        return false;
    }
};
