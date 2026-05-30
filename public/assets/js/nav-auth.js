/**
 * nav-auth.js
 * Auth-aware navigation enhancement.
 * Completely NEW file — does not modify nav.js.
 *
 * Works by looking for elements with these IDs in the page:
 *   #navSignIn       — Sign In button/link
 *   #navSignUp       — Sign Up button/link (optional)
 *   #navMyAccount    — My Account link (hidden by default)
 *   #navLogout       — Logout button (hidden by default)
 *   #adminNavLink    — Admin link (handled here too, so nav.js is not needed)
 *   #vendorNavLink   — Vendor panel link (optional)
 *   #navCartCount    — Cart badge count span
 *
 * Pages only need to include these IDs in their nav HTML.
 * This script is additive: if an element is missing it is safely skipped.
 */

(async function initNavAuth() {
    try {
        const res  = await fetch('/api/me');
        if (!res.ok) return;
        const user = await res.json();

        const signIn     = document.getElementById('navSignIn');
        const signUp     = document.getElementById('navSignUp');
        const myAccount  = document.getElementById('navMyAccount');
        const logout     = document.getElementById('navLogout');
        const adminLink  = document.getElementById('adminNavLink');
        const vendorLink = document.getElementById('vendorNavLink');
        const cartBadge  = document.getElementById('navCartBadge');

        if (user.isLoggedIn) {
            // Hide auth buttons
            if (signIn)    signIn.style.display    = 'none';
            if (signUp)    signUp.style.display     = 'none';

            // Show account buttons
            if (myAccount) myAccount.style.display = 'inline-flex';
            if (logout)    logout.style.display    = 'inline-flex';

            // Admin link
            if (adminLink && (user.role === 'admin' || user.role === 'superadmin')) {
                adminLink.style.display = 'inline-block';
            }

            // Vendor link
            if (vendorLink && user.role === 'vendor') {
                vendorLink.style.display = 'inline-block';
            }

            // Update account button label with first name
            if (myAccount && user.firstName) {
                const nameSpan = myAccount.querySelector('.nav-user-name');
                if (nameSpan) nameSpan.textContent = user.firstName;
            }

            // Fetch cart count for badge
            try {
                const cartRes = await fetch('/api/cart/count');
                if (cartRes.ok) {
                    const { count } = await cartRes.json();
                    updateCartBadge(count);
                }
            } catch (_) {}

        } else {
            // Not logged in: make sure logged-in elements are hidden
            if (myAccount) myAccount.style.display = 'none';
            if (logout)    logout.style.display    = 'none';
            if (signIn)    signIn.style.display    = 'inline-flex';
            if (signUp)    signUp.style.display    = 'inline-flex';
        }
    } catch (err) {
        console.warn('nav-auth: could not reach /api/me', err);
    }
})();

// Attach logout handler to any element with id="navLogout"
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('navLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
            } catch (_) {}
            window.location.href = '/index.html';
        });
    }
});

// Cart badge helper (also exposed globally so cart.js can call it)
function updateCartBadge(count) {
    const badge = document.getElementById('navCartBadge');
    if (!badge) return;
    badge.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
    badge.style.display = count > 0 ? 'flex' : 'none';
}

window.updateCartBadge = updateCartBadge;
