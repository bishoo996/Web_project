// 1. Auth Protection
async function checkAdminStatus() {
    try {
        const response = await fetch('/api/me'); 
        const data = await response.json();
        if (!data.isLoggedIn || data.role !== 'admin') {
            alert('Access Denied.');
            window.location.href = '/index.html'; 
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

async function loadInventory() {
    try {
        const response = await fetch('/api/admin/products');
        const products = await response.json();
        const tbody = document.getElementById('inventoryTableBody');
        
        tbody.innerHTML = ''; // Clear existing table

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94A3B8;">No products in inventory.</td></tr>`;
            return;
        }

        products.forEach(p => {
            // Determine stock badge color
            let stockColor = '#10B981'; // Green for 'in'
            if (p.stockStatus === 'low') stockColor = '#F59E0B'; // Orange
            if (p.stockStatus === 'out') stockColor = '#EF4444'; // Red

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #333; transition: background 0.2s;">
                    <td style="padding: 12px; font-weight: bold;">
                        ${p.manufacturer} ${p.title}
                    </td>
                    <td style="padding: 12px; text-transform: uppercase; font-size: 12px; color: #7C3AED; font-weight: bold;">
                        ${p.category}
                    </td>
                    <td style="padding: 12px;">$${p.price}</td>
                    <td style="padding: 12px;">
                        <span style="background: ${stockColor}20; color: ${stockColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            ${p.stockStatus.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 12px; text-align: right;">
                        <button onclick="deleteProduct('${p._id}')" style="background: transparent; color: #ff4444; border: 1px solid #ff4444; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#ff4444'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#ff4444'">
                            Delete
                        </button>
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

// 1. Load inventory immediately on page load
loadInventory();

// 2. Refresh inventory every time the user clicks the "Manage Inventory" tab
document.querySelector('[data-target="inventory-section"]').addEventListener('click', loadInventory);






