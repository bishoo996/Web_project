/**
 * cart-widget.js
 * NEW FILE — a lightweight, self-contained "Add to Cart" widget.
 *
 * Any page can include this script and call:
 *   CartWidget.add(productId)           — add 1 unit
 *   CartWidget.add(productId, qty)      — add N units
 *
 * The widget:
 *  - Shows a toast notification (no page redirect required)
 *  - Updates the nav cart badge
 *  - Falls back gracefully if not logged in (prompts sign-in)
 *
 * Does NOT modify any existing page or script.
 */

(function () {
    'use strict';

    // ── Toast ──────────────────────────────────────────────────────────────────
    function createToastEl() {
        if (document.getElementById('cwToast')) return;
        const el = document.createElement('div');
        el.id = 'cwToast';
        el.style.cssText = [
            'position:fixed', 'bottom:24px', 'right:24px', 'z-index:99999',
            'background:var(--surface-color,#0B1120)',
            'border:1px solid rgba(124,58,237,0.45)',
            'color:var(--text-color,#E5E7EB)',
            'padding:12px 20px', 'border-radius:10px',
            'font-size:14px', 'font-weight:600',
            'box-shadow:0 8px 24px rgba(0,0,0,0.4)',
            'transform:translateY(80px)', 'opacity:0',
            'transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
            'pointer-events:none'
        ].join(';');
        document.body.appendChild(el);
    }

    function showToast(message, type) {
        createToastEl();
        const el = document.getElementById('cwToast');
        el.textContent = message;
        el.style.borderColor = type === 'error'
            ? 'rgba(239,68,68,0.5)'
            : 'rgba(124,58,237,0.45)';
        el.style.transform = 'translateY(0)';
        el.style.opacity   = '1';
        clearTimeout(el._timer);
        el._timer = setTimeout(() => {
            el.style.transform = 'translateY(80px)';
            el.style.opacity   = '0';
        }, 3000);
    }

    // ── Cart badge ─────────────────────────────────────────────────────────────
    function updateBadge(count) {
        // If nav-auth.js is loaded it will have set window.updateCartBadge
        if (typeof window.updateCartBadge === 'function') {
            window.updateCartBadge(count);
            return;
        }
        // Fallback: look for the badge element directly
        const badge = document.getElementById('navCartBadge');
        if (!badge) return;
        badge.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
        badge.style.display = count > 0 ? 'flex' : 'none';
    }

    // ── Core add function ──────────────────────────────────────────────────────
    async function add(productId, quantity = 1) {
        if (!productId) {
            showToast('⚠️ Invalid product', 'error');
            return false;
        }

        try {
            const res = await fetch('/api/cart/add', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ productId, quantity })
            });

            if (res.status === 401) {
                showToast('🔒 Sign in to add items to cart', 'error');
                setTimeout(() => { window.location.href = './sign_in.html'; }, 1500);
                return false;
            }

            const data = await res.json();

            if (!res.ok) {
                showToast('❌ ' + (data.error || 'Could not add to cart'), 'error');
                return false;
            }

            showToast('✅ Added to cart!', 'success');
            updateBadge(data.itemCount);
            return true;

        } catch {
            showToast('❌ Network error — please try again', 'error');
            return false;
        }
    }

    // ── Toggle wishlist ────────────────────────────────────────────────────────
    async function toggleWishlist(productId, btnEl) {
        if (!productId) return;
        try {
            const res  = await fetch(`/api/account/wishlist/${productId}`, { method: 'POST' });
            if (res.status === 401) {
                showToast('🔒 Sign in to use wishlist', 'error');
                return;
            }
            const data = await res.json();
            const added = data.action === 'added';
            showToast(added ? '❤️ Added to wishlist!' : '💔 Removed from wishlist', 'success');
            if (btnEl) {
                btnEl.textContent = added ? '❤️ Remove from Wishlist' : 'Add to Wishlist';
                btnEl.title       = added ? 'Remove from Wishlist' : 'Add to Wishlist';
            }
        } catch {
            showToast('❌ Failed to update wishlist', 'error');
        }
    }

    // ── Track recently viewed ──────────────────────────────────────────────────
    async function trackView(productId) {
        if (!productId) return;
        try {
            await fetch(`/api/account/recently-viewed/${productId}`, { method: 'POST' });
        } catch { /* silent */ }
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    window.CartWidget = { add, toggleWishlist, trackView };

}());
