// 1. Auth Protection
let currentUserRole = null;

async function checkAdminStatus() {
    try {
        const response = await fetch('/api/me');
        const data = await response.json();
        if (!data.isLoggedIn || (data.role !== 'admin' && data.role !== 'superadmin')) {
            alert('Access Denied.');
            window.location.href = '/index.html';
        }
        currentUserRole = data.role;
        if (data.role === 'superadmin') {
            document.querySelector('.sidebar h2').textContent = 'Super Admin';
        }
    } catch (error) { window.location.href = '/sign_in.html'; }
}
checkAdminStatus();

// 2. Tab Switching Logic
const navButtons = document.querySelectorAll('.nav-btn[data-target]'); //zombie code
const contentSections = document.querySelectorAll('.content-section');

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and sections
        navButtons.forEach(b => b.classList.remove('active'));
        contentSections.forEach(s => s.classList.remove('active'));

        // Add active class to clicked button and its target section
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// 3. Reusable Submit Function (Keeps code clean!)
async function handleFormSubmit(event, endpoint, payload, messageDivId) {
    event.preventDefault();
    const msgDiv = document.getElementById(messageDivId);
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const resultText = await response.text();

        if (response.ok) {
            msgDiv.style.color = '#00ff00'; // Success green
            msgDiv.innerText = resultText;
            event.target.reset(); // Clear the form
            
            // Notify benchmark page to refresh data
            if (window.refreshBenchmarkData) {
                window.refreshBenchmarkData();
            }
        } else {
            msgDiv.style.color = '#ff4444'; // Error red
            msgDiv.innerText = resultText;
        }
    } catch (error) {
        msgDiv.style.color = '#ff4444';
        msgDiv.innerText = 'Network Error.';
    }
}

// ==========================================
// UNIVERSAL PRODUCT FORM LOGIC
// ==========================================

// 1. Dynamic Specs Builder
const specsContainer = document.getElementById('specsContainer');
const addSpecBtn = document.getElementById('addSpecBtn');

addSpecBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '10px';
    
    row.innerHTML = `
        <input type="text" class="spec-key" placeholder="Spec Name (e.g., Switch)" style="flex: 1; margin: 0;">
        <input type="text" class="spec-val" placeholder="Value (e.g., Cherry MX)" style="flex: 2; margin: 0;">
        <button type="button" onclick="this.parentElement.remove()" style="background: #ff4444; color: white; border: none; padding: 0 10px; border-radius: 5px; cursor: pointer;">X</button>
    `;
    specsContainer.appendChild(row);
});

// 2. The Magic Link Logic
const categorySelect = document.getElementById('prodCategory');
const magicLinkContainer = document.getElementById('magicLinkContainer');
const baselineSelect = document.getElementById('prodBaselineId');

// Watch the category dropdown. If it's a CPU or GPU, show the Magic Link!
categorySelect.addEventListener('change', async (e) => {
    const cat = e.target.value;
    if (cat === 'cpu' || cat === 'gpu') {
        magicLinkContainer.style.display = 'block';
        
        // Fetch the raw silicon to put in the dropdown
        try {
            const response = await fetch('/api/hardware');
            const data = await response.json();
            
            baselineSelect.innerHTML = '<option value="">-- Select Raw Hardware --</option>';
            const targetArray = cat === 'cpu' ? data.cpus : data.gpus;
            
            targetArray.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item._id; // The Mongo ID!
                opt.textContent = `${item.brand} ${item.name}`;
                baselineSelect.appendChild(opt);
            });
        } catch (err) { console.error("Failed to load baseline hardware"); }
    } else {
        magicLinkContainer.style.display = 'none';
        baselineSelect.innerHTML = '<option value="">-- Do Not Link --</option>';
    }
});

// 3. Submit the Universal Form
document.getElementById('addProductForm').addEventListener('submit', (e) => {
    
    // A. Gather the dynamic specs
    const specKeys = document.querySelectorAll('.spec-key');
    const specVals = document.querySelectorAll('.spec-val');
    const specsArray = [];
    
    for (let i = 0; i < specKeys.length; i++) {
        if (specKeys[i].value && specVals[i].value) {
            specsArray.push({ k: specKeys[i].value, v: specVals[i].value });
        }
    }

    // B. Check for Magic Link
    const category = document.getElementById('prodCategory').value;
    const baselineId = document.getElementById('prodBaselineId').value;
    let hardwareModel = undefined;
    
    if (baselineId) {
        hardwareModel = category === 'cpu' ? 'CPU' : 'GPU';
    }

    // C. Build the Payload
    const payload = {
        title: document.getElementById('prodTitle').value,
        manufacturer: document.getElementById('prodMfg').value,
        category: category,
        price: Number(document.getElementById('prodPrice').value),
        stockStatus: document.getElementById('prodStock').value,
        imageUrl: document.getElementById('prodImage').value,
        specs: specsArray,
        baselineHardwareId: baselineId || undefined,
        hardwareModel: hardwareModel
    };

    handleFormSubmit(e, '/api/admin/add-product', payload, 'productMessage');
    specsContainer.innerHTML = ''; // Clear specs after submit
});


// ==========================================
// INVENTORY MANAGEMENT LOGIC
// ==========================================

const productsMap = {};

async function loadInventory() {
    try {
        const response = await fetch('/api/admin/products');
        const products = await response.json();
        const tbody = document.getElementById('inventoryTableBody');

        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94A3B8;">No products in inventory.</td></tr>`;
            return;
        }

        products.forEach(p => {
            productsMap[p._id] = p;

            let stockColor = '#10B981';
            if (p.stockStatus === 'low') stockColor = '#F59E0B';
            if (p.stockStatus === 'out') stockColor = '#EF4444';

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 12px; font-weight: bold;">${p.manufacturer} ${p.title}</td>
                    <td style="padding: 12px; text-transform: uppercase; font-size: 12px; color: #7C3AED; font-weight: bold;">${p.category}</td>
                    <td style="padding: 12px;">$${p.price}</td>
                    <td style="padding: 12px;">
                        <span style="background: ${stockColor}20; color: ${stockColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            ${p.stockStatus.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="openEditModal('${p._id}')" style="background: transparent; color: #ffaa00; border: 1px solid #ffaa00; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onmouseover="this.style.background='#ffaa00'; this.style.color='#000'" onmouseout="this.style.background='transparent'; this.style.color='#ffaa00'">Edit</button>
                        <button onclick="deleteProduct('${p._id}')" style="background: transparent; color: #ff4444; border: 1px solid #ff4444; padding: 6px 12px; border-radius: 4px; cursor: pointer;" onmouseover="this.style.background='#ff4444'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#ff4444'">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading inventory:', err);
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you absolutely sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`/api/admin/delete-product/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Product deleted successfully.');
            loadInventory(); // Refresh the table instantly
        } else {
            alert('Failed to delete product.');
        }
    } catch (err) {
        console.error('Error deleting product:', err);
    }
}


// ==========================================
// BENCHMARK ENGINE LOGIC
// ==========================================

document.getElementById('addCpuForm').addEventListener('submit', (e) => {
    const payload = {
        name: document.getElementById('cpuName').value,
        brand: document.getElementById('cpuBrand').value,
        socket: document.getElementById('cpuSocket').value,
        price: Number(document.getElementById('cpuPrice').value),
        computeScore: Number(document.getElementById('cpuScore').value)
    };
    handleFormSubmit(e, '/api/admin/add-cpu', payload, 'cpuMessage');
});

document.getElementById('addGpuForm').addEventListener('submit', (e) => {
    const payload = {
        name: document.getElementById('gpuName').value,
        brand: document.getElementById('gpuBrand').value,
        vram: Number(document.getElementById('gpuVram').value),
        price: Number(document.getElementById('gpuPrice').value),
        renderScores: {
            p1080: Number(document.getElementById('gpu1080').value),
            p1440: Number(document.getElementById('gpu1440').value),
            p4k: Number(document.getElementById('gpu4k').value)
        }
    };
    handleFormSubmit(e, '/api/admin/add-gpu', payload, 'gpuMessage');
});

document.getElementById('addGameForm').addEventListener('submit', (e) => {
    const payload = {
        title: document.getElementById('gameTitle').value,
        optimizationFactor: Number(document.getElementById('gameOpt').value),
        cpuIntensive: document.getElementById('gameCpuIntensive').checked,
        imageUrl: document.getElementById('gameImage').value
    };
    handleFormSubmit(e, '/api/admin/add-game', payload, 'gameMessage');
});

// Load inventory on page load and on tab click
loadInventory();
document.querySelector('[data-target="inventory-section"]').addEventListener('click', loadInventory);


// ==========================================
// EDIT PRODUCT MODAL
// ==========================================

function openEditModal(id) {
    const p = productsMap[id];
    if (!p) return;
    document.getElementById('editProductId').value = p._id;
    document.getElementById('editTitle').value = p.title;
    document.getElementById('editMfg').value = p.manufacturer;
    document.getElementById('editPrice').value = p.price;
    document.getElementById('editStock').value = p.stockStatus;
    document.getElementById('editCategory').value = p.category;
    document.getElementById('editImage').value = p.imageUrl || '';
    document.getElementById('editMessage').innerText = '';
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function submitEdit() {
    const id = document.getElementById('editProductId').value;
    const payload = {
        title: document.getElementById('editTitle').value,
        manufacturer: document.getElementById('editMfg').value,
        price: Number(document.getElementById('editPrice').value),
        stockStatus: document.getElementById('editStock').value,
        category: document.getElementById('editCategory').value,
        imageUrl: document.getElementById('editImage').value
    };
    const msgDiv = document.getElementById('editMessage');
    try {
        const res = await fetch(`/api/admin/edit-product/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            msgDiv.style.color = '#00ff00';
            msgDiv.innerText = 'Product updated!';
            setTimeout(() => { closeEditModal(); loadInventory(); }, 900);
        } else {
            msgDiv.style.color = '#ff4444';
            msgDiv.innerText = await res.text();
        }
    } catch (err) {
        msgDiv.style.color = '#ff4444';
        msgDiv.innerText = 'Network error.';
    }
}

// Close modal on backdrop click
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModal')) closeEditModal();
});


// ==========================================
// USERS MANAGEMENT
// ==========================================

const ROLE_COLORS = { customer: 'customer', vendor: 'vendor', admin: 'admin', superadmin: 'superadmin' };

async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94A3B8;">No users found.</td></tr>`;
            return;
        }

        const isSuperAdmin = currentUserRole === 'superadmin';

        users.forEach(u => {
            const joined = new Date(u.createdAt).toLocaleDateString();
            const roleClass = ROLE_COLORS[u.role] || 'customer';

            const roleCell = isSuperAdmin
                ? `<select onchange="updateUserRole('${u._id}', this.value)" style="background:#2a2a2a; color:white; border:1px solid #444; padding:4px 6px; border-radius:4px; font-size:12px;">
                    ${['customer','vendor','admin','superadmin'].map(r =>
                        `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`
                    ).join('')}
                   </select>`
                : `<span class="role-badge role-${roleClass}">${u.role}</span>`;

            const actionCell = isSuperAdmin
                ? `<button onclick="deleteUser('${u._id}')" style="background:transparent; color:#ff4444; border:1px solid #ff4444; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;" onmouseover="this.style.background='#ff4444';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='#ff4444'">Delete</button>`
                : `<span style="color:#555; font-size:12px;">—</span>`;

            tbody.innerHTML += `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:12px; font-weight:bold;">${u.firstName} ${u.lastName}</td>
                    <td style="padding:12px; color:#94A3B8; font-size:13px;">${u.email}</td>
                    <td style="padding:12px;">${roleCell}</td>
                    <td style="padding:12px; color:#94A3B8; font-size:13px;">${u.phoneNumber || '—'}</td>
                    <td style="padding:12px; color:#94A3B8; font-size:13px;">${joined}</td>
                    <td style="padding:12px; text-align:right;">${actionCell}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading users:', err);
    }
}

async function updateUserRole(id, role) {
    try {
        const res = await fetch(`/api/admin/users/${id}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        if (!res.ok) alert(await res.text());
    } catch (err) {
        console.error('Error updating role:', err);
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user permanently?')) return;
    try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) loadUsers();
        else alert(await res.text());
    } catch (err) {
        console.error('Error deleting user:', err);
    }
}

document.querySelector('[data-target="users-section"]').addEventListener('click', loadUsers);


// ==========================================
// ORDERS OVERVIEW
// ==========================================

const ORDER_STATUS_COLORS = {
    pending: '#94A3B8', processing: '#60A5FA', shipped: '#A78BFA',
    delivered: '#10B981', cancelled: '#EF4444'
};

async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        const orders = await response.json();
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94A3B8;">No orders found.</td></tr>`;
            return;
        }

        orders.forEach(o => {
            const customer = o.userId
                ? `${o.userId.firstName} ${o.userId.lastName}<br><span style="font-size:11px; color:#94A3B8;">${o.userId.email}</span>`
                : 'Deleted User';
            const date = new Date(o.createdAt).toLocaleDateString();
            const shortId = o._id.toString().slice(-6).toUpperCase();
            const color = ORDER_STATUS_COLORS[o.status] || '#94A3B8';

            tbody.innerHTML += `
                <tr style="border-bottom:1px solid #333;">
                    <td style="padding:12px; font-family:monospace; color:#7C3AED;">#${shortId}</td>
                    <td style="padding:12px;">${customer}</td>
                    <td style="padding:12px; color:#94A3B8; font-size:13px;">${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
                    <td style="padding:12px; font-weight:bold;">$${o.total.toFixed(2)}</td>
                    <td style="padding:12px;">
                        <select onchange="updateOrderStatus('${o._id}', this.value)" style="background:#2a2a2a; color:${color}; border:1px solid #444; padding:4px 6px; border-radius:4px; font-size:12px;">
                            ${['pending','processing','shipped','delivered','cancelled'].map(s =>
                                `<option value="${s}" ${o.status === s ? 'selected' : ''} style="color:${ORDER_STATUS_COLORS[s]}">${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
                            ).join('')}
                        </select>
                    </td>
                    <td style="padding:12px; color:#94A3B8; font-size:13px;">${date}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error loading orders:', err);
    }
}

async function updateOrderStatus(id, status) {
    try {
        const res = await fetch(`/api/admin/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) alert(await res.text());
    } catch (err) {
        console.error('Error updating order status:', err);
    }
}

document.querySelector('[data-target="orders-section"]').addEventListener('click', loadOrders);






