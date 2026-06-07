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

    // ── Modal prompt for duplicate items ─────────────────────────────────────
    function ensureModalExists() {
        if (document.getElementById('cwConfirmModal')) return;
        const overlay = document.createElement('div');
        overlay.id = 'cwConfirmModal';
        overlay.style.cssText = [
            'position:fixed', 'inset:0', 'display:flex', 'align-items:center', 'justify-content:center',
            'background:rgba(0,0,0,0.45)', 'z-index:100000', 'opacity:0', 'pointer-events:none',
            'transition:opacity 0.18s ease'
        ].join(';');

        const box = document.createElement('div');
        box.style.cssText = [
            'background:var(--surface-color,#fff)', 'color:var(--text-color,#0b1120)', 'padding:18px',
            'border-radius:10px', 'width:360px', 'max-width:92%', 'box-shadow:0 12px 40px rgba(2,6,23,0.6)'
        ].join(';');

        box.innerHTML = `
            <div id="cwConfirmTitle" style="font-weight:700;margin-bottom:8px"></div>
            <div id="cwConfirmBody" style="font-size:13px;margin-bottom:16px;color:var(--text-secondary,#6b7280)"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
                <button id="cwBtnCancel" style="padding:8px 12px;border-radius:8px;background:transparent;border:1px solid #ddd">Cancel</button>
                <button id="cwBtnSet2" style="padding:8px 12px;border-radius:8px;background:#6b7280;color:#fff;border:0">Make 2</button>
                <button id="cwBtnAddOne" style="padding:8px 12px;border-radius:8px;background:#2ea44f;color:#fff;border:0">Add one more</button>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => { if (e.target === overlay) hideConfirmModal(); });

        document.getElementById('cwBtnCancel').addEventListener('click', hideConfirmModal);
        // buttons' handlers are wired by showConfirmModal which sets callbacks on the overlay element
    }

    function showConfirmModal(title, body, { onAddOne, onSetTwo }) {
        ensureModalExists();
        const overlay = document.getElementById('cwConfirmModal');
        document.getElementById('cwConfirmTitle').textContent = title;
        document.getElementById('cwConfirmBody').textContent = body;

        // detach previous handlers
        const btnAddOne = document.getElementById('cwBtnAddOne');
        const btnSet2   = document.getElementById('cwBtnSet2');
        const newAdd    = async () => { hideConfirmModal(); try { await onAddOne(); } catch (e) { console.error(e); } };
        const newSet2   = async () => { hideConfirmModal(); try { await onSetTwo(); } catch (e) { console.error(e); } };

        btnAddOne.replaceWith(btnAddOne.cloneNode(true));
        btnSet2.replaceWith(btnSet2.cloneNode(true));

        document.getElementById('cwBtnAddOne').addEventListener('click', newAdd);
        document.getElementById('cwBtnSet2').addEventListener('click', newSet2);

        overlay.style.pointerEvents = 'auto';
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    }

    function hideConfirmModal() {
        const overlay = document.getElementById('cwConfirmModal');
        if (!overlay) return;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
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
    async function add(productId, quantity = 1, evt) {
        if (!productId) {
            showToast('⚠️ Invalid product', 'error');
            return false;
        }

        try {
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get('from') === 'builder') {
                try { sessionStorage.setItem('builderFlowCart', 'true'); } catch (_) {}
            }

            // Check cart for duplicates first
            try {
                const existingCartRes = await fetch('/api/cart');
                if (existingCartRes.ok) {
                    const existingCart = await existingCartRes.json();
                    const existingItem = (existingCart.items || []).find(i => {
                        const id = i.productId?._id || i.productId;
                        return String(id) === String(productId);
                    });
                    if (existingItem) {
                        const existingQty = existingItem.quantity || 1;
                        // Only show modal for trusted user events. If not a user gesture, default to adding one.
                        if (!(evt && evt.isTrusted)) {
                            const newQty = existingQty + (quantity || 1);
                            await fetch(`/api/cart/item/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty }) });
                            const rc = await fetch('/api/cart'); if (rc.ok) { const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0)); }
                            showToast('✅ Cart updated', 'success');
                            return true;
                        }

                        showConfirmModal('Item already in cart',
                            'This product is already in your cart. Would you like to add one more, or set the quantity to 2?',
                            {
                                onAddOne: async () => {
                                    // Set quantity = existingQty + quantity
                                    const newQty = existingQty + (quantity || 1);
                                    await fetch(`/api/cart/item/${productId}`, {
                                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ quantity: newQty })
                                    });
                                    const rc = await fetch('/api/cart');
                                    if (rc.ok) {
                                        const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0));
                                    }
                                    showToast('✅ Cart updated', 'success');
                                },
                                onSetTwo: async () => {
                                    const newQty = 2;
                                    await fetch(`/api/cart/item/${productId}`, {
                                        method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ quantity: newQty })
                                    });
                                    const rc = await fetch('/api/cart');
                                    if (rc.ok) {
                                        const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0));
                                    }
                                    showToast('✅ Quantity set to 2', 'success');
                                }
                            }
                        );
                        return true;
                    }
                }
            } catch (err) {
                console.error('Failed to check existing cart before add', err);
            }

            // No duplicate — proceed to add
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

    // ── Add from builder (category page → builder selection) ─────────────────
    async function addFromBuilder(productId, componentId, evt) {
        if (!productId || !componentId) {
            showToast('⚠️ Invalid product or component', 'error');
            return false;
        }

        try {
            // 1. Fetch product details to build the part object
            const productRes = await fetch(`/api/product/${productId}`);
            if (!productRes.ok) {
                showToast('❌ Product not found', 'error');
                return false;
            }
            const product = await productRes.json();

            // If user came from builder and a part is already selected for this component,
            // prompt only for real user clicks (evt.isTrusted). Programmatic calls shouldn't trigger UI.
            try {
                const parts = JSON.parse(sessionStorage.getItem('builderParts') || '{}');
                if (parts && parts[componentId]) {
                    if (!(evt && evt.isTrusted)) {
                        // Not a direct user gesture — skip prompting to avoid unexpected popups
                        return false;
                    }
                    // Show modal to let user pick add-one or make-2
                    showConfirmModal('Replace or Add?', `${product.title} — you already have a selection for this slot. Add one more to cart or set quantity to 2?`, {
                        onAddOne: async () => {
                            // Attempt to add one via API
                            try {
                                const addRes = await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, quantity: 1 }) });
                                if (addRes.status === 401) { showToast('🔒 Sign in to add items to cart', 'error'); setTimeout(()=>window.location.href='./sign_in.html',1500); return; }
                            } catch (e) { console.error('Failed to add one', e); }
                            try { sessionStorage.setItem('pendingPart', JSON.stringify({ componentId, part: {
                                productId: productId, name: product.title, specs: (product.specs||[]).slice(0,3).map(s=>`${s.k}: ${s.v}`).join(' · '),
                                badges: product.badges||[], icon: _getBuilderIcon(componentId)||_getBuilderIcon(product.category)||'inventory_2', watts:null, bench:null,
                                avail: product.stockStatus||'in', price:`$${product.price.toFixed(2)}`, formFactor:(product.specs||[]).find(s=> (s.k||'').toLowerCase().includes('form'))?.v||null,
                                socket:(product.specs||[]).find(s=>(s.k||'').toLowerCase()==='socket')?.v||null,
                                memType:(product.specs||[]).find(s=>(s.k||'').toLowerCase().includes('memory type'))?.v||null
                            } })); sessionStorage.setItem('builderFlowCart','true'); } catch(_){}
                            const rc = await fetch('/api/cart'); if (rc.ok) { const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0)); }
                            showToast('✅ Added to cart', 'success');
                            setTimeout(()=>{ window.location.href = './builder_index.html'; }, 700);
                        },
                        onSetTwo: async () => {
                            try {
                                await fetch(`/api/cart/item/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: 2 }) });
                            } catch (e) { console.error('Failed to set qty to 2', e); }
                            try { sessionStorage.setItem('pendingPart', JSON.stringify({ componentId, part: {
                                productId: productId, name: product.title, specs: (product.specs||[]).slice(0,3).map(s=>`${s.k}: ${s.v}`).join(' · '),
                                badges: product.badges||[], icon: _getBuilderIcon(componentId)||_getBuilderIcon(product.category)||'inventory_2', watts:null, bench:null,
                                avail: product.stockStatus||'in', price:`$${product.price.toFixed(2)}`, formFactor:(product.specs||[]).find(s=> (s.k||'').toLowerCase().includes('form'))?.v||null,
                                socket:(product.specs||[]).find(s=>(s.k||'').toLowerCase()==='socket')?.v||null,
                                memType:(product.specs||[]).find(s=>(s.k||'').toLowerCase().includes('memory type'))?.v||null
                            } })); sessionStorage.setItem('builderFlowCart','true'); } catch(_){}
                            const rc = await fetch('/api/cart'); if (rc.ok) { const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0)); }
                            showToast('✅ Quantity set to 2', 'success');
                            setTimeout(()=>{ window.location.href = './builder_index.html'; }, 700);
                        }
                    });
                    return true;
                }
            } catch (err) {
                console.error('Failed to read builderParts', err);
            }

            // 2. Check cart to avoid duplicate adds (if user already added this product)
            try {
                const existingCartRes = await fetch('/api/cart');
                if (existingCartRes.ok) {
                    const existingCart = await existingCartRes.json();
                    const already = (existingCart.items || []).some(i => {
                        const id = i.productId?._id || i.productId;
                        return String(id) === String(productId);
                    });
                    if (already) {
                        const existingItem = (existingCart.items || []).find(i => {
                            const id = i.productId?._id || i.productId; return String(id) === String(productId);
                        });
                        const existingQty = existingItem ? (existingItem.quantity || 1) : 1;

                        showConfirmModal('Item already in cart', `\n"${product.title}" is already in your cart (qty: ${existingQty}). Add one more, or set the quantity to 2?`, {
                            onAddOne: async () => {
                                // increment
                                const newQty = existingQty + 1;
                                await fetch(`/api/cart/item/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty }) });
                                // store pending part and redirect
                                try {
                                    const part = {
                                        productId: productId,
                                        name: product.title,
                                        specs: (product.specs || []).slice(0, 3).map(s => `${s.k}: ${s.v}`).join(' · '),
                                        badges: product.badges || [],
                                        icon: _getBuilderIcon(componentId) || _getBuilderIcon(product.category) || 'inventory_2',
                                        watts: null,
                                        bench: null,
                                        avail: product.stockStatus || 'in',
                                        price: `$${product.price.toFixed(2)}`,
                                        formFactor: (product.specs || []).find(s => (s.k || '').toLowerCase().includes('form'))?.v || null,
                                        socket: (product.specs || []).find(s => (s.k || '').toLowerCase() === 'socket')?.v || null,
                                        memType: (product.specs || []).find(s => (s.k || '').toLowerCase().includes('memory type'))?.v || null
                                    };
                                    sessionStorage.setItem('pendingPart', JSON.stringify({ componentId, part }));
                                    sessionStorage.setItem('builderFlowCart', 'true');
                                } catch (_) {}
                                const rc = await fetch('/api/cart'); if (rc.ok) { const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0)); }
                                showToast('✅ Cart updated', 'success');
                                setTimeout(() => { window.location.href = './builder_index.html'; }, 700);
                            },
                            onSetTwo: async () => {
                                const newQty = 2;
                                await fetch(`/api/cart/item/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: newQty }) });
                                try {
                                    const part = {
                                        productId: productId,
                                        name: product.title,
                                        specs: (product.specs || []).slice(0, 3).map(s => `${s.k}: ${s.v}`).join(' · '),
                                        badges: product.badges || [],
                                        icon: _getBuilderIcon(componentId) || _getBuilderIcon(product.category) || 'inventory_2',
                                        watts: null,
                                        bench: null,
                                        avail: product.stockStatus || 'in',
                                        price: `$${product.price.toFixed(2)}`,
                                        formFactor: (product.specs || []).find(s => (s.k || '').toLowerCase().includes('form'))?.v || null,
                                        socket: (product.specs || []).find(s => (s.k || '').toLowerCase() === 'socket')?.v || null,
                                        memType: (product.specs || []).find(s => (s.k || '').toLowerCase().includes('memory type'))?.v || null
                                    };
                                    sessionStorage.setItem('pendingPart', JSON.stringify({ componentId, part }));
                                    sessionStorage.setItem('builderFlowCart', 'true');
                                } catch (_) {}
                                const rc = await fetch('/api/cart'); if (rc.ok) { const d = await rc.json(); updateBadge((d.items||[]).reduce((s,i)=>s+(i.quantity||0),0)); }
                                showToast('✅ Quantity set to 2', 'success');
                                setTimeout(() => { window.location.href = './builder_index.html'; }, 700);
                            }
                        });
                        return true;
                    }
                }
            } catch (err) {
                // If cart check fails, fall back to attempting to add normally
                console.error('Failed to check existing cart for duplicates', err);
            }

            // 3. Add to cart
            const cartRes = await fetch('/api/cart/add', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ productId, quantity: 1 })
            });

            if (cartRes.status === 401) {
                showToast('🔒 Sign in to add items to cart', 'error');
                setTimeout(() => { window.location.href = './sign_in.html'; }, 1500);
                return false;
            }

            if (!cartRes.ok) {
                const data = await cartRes.json();
                showToast('❌ ' + (data.error || 'Could not add to cart'), 'error');
                return false;
            }

            const cartData = await cartRes.json();
            updateBadge(cartData.itemCount);

            // 3. Build the part object for the builder
            const wattSpec = (product.specs || []).find(s => {
                const k = (s.k || '').toLowerCase();
                return k.includes('tdp') || k.includes('watt') || k.includes('power');
            });
            const rawWatts = wattSpec ? parseInt(wattSpec.v) : null;

            const part = {
                productId: productId,
                name: product.title,
                specs: (product.specs || []).slice(0, 3).map(s => `${s.k}: ${s.v}`).join(' · '),
                badges: product.badges || [],
                icon: _getBuilderIcon(componentId) || _getBuilderIcon(product.category) || 'inventory_2',
                watts: (!isNaN(rawWatts) && rawWatts > 0) ? rawWatts : null,
                bench: null,
                avail: product.stockStatus || 'in',
                price: `$${product.price.toFixed(2)}`,
                formFactor: (product.specs || []).find(s => (s.k || '').toLowerCase().includes('form'))?.v || null,
                socket: (product.specs || []).find(s => (s.k || '').toLowerCase() === 'socket')?.v || null,
                memType: (product.specs || []).find(s => (s.k || '').toLowerCase().includes('memory type'))?.v || null
            };

            // 4. Store pending part in sessionStorage for builder to pick up
            try {
                sessionStorage.setItem('pendingPart', JSON.stringify({ componentId, part }));
                sessionStorage.setItem('builderFlowCart', 'true');
            } catch (_) {}

            // 5. Redirect back to builder
            showToast(`✅ ${product.title} added!`, 'success');
            setTimeout(() => {
                window.location.href = './builder_index.html';
            }, 800);

            return true;

        } catch (err) {
            console.error('Builder add error:', err);
            showToast('❌ Network error — please try again', 'error');
            return false;
        }
    }

    // ── Helper: get builder icon for component ────────────────────────────────
    function _getBuilderIcon(componentId) {
        const iconMap = {
            cpu: 'memory', gpu: 'sports_esports', motherboard: 'desktop_windows',
            memory: 'memory', memory2: 'memory', storage: 'storage', psu: 'power',
            case: 'desktop_windows', cooler: 'ac_unit', monitor: 'desktop_mac',
            keyboard: 'keyboard', mouse: 'mouse', headset: 'headset'
        };
        return iconMap[(componentId || '').toLowerCase()];
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    window.CartWidget = { add, addFromBuilder, toggleWishlist, trackView };

}());
