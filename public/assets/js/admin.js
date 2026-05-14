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
const navButtons = document.querySelectorAll('.nav-btn[data-target]');
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

// 4. Attach Listeners to Forms
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
        // Notice we nest the scores exactly like our Mongoose Schema dictates!
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


async function loadLiveHardware() {  //fetch DB data and populate dropdowns
    try {
        const response = await fetch('/api/hardware');
        const data = await response.json();
        
        renderAdminLists('adminCpuList', data.cpus, 'cpu');
        renderAdminLists('adminGpuList', data.gpus, 'gpu');
        renderAdminLists('adminGameList', data.games, 'game');

        } catch (err) {
        console.error('Error fetching hardware data', err);
        }
    } 

function renderAdminLists(containerId, items, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear existing list

    items.forEach(item => {
        const li = document.createElement('li');
        li.style.marginBottom = '10px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const displayName = item.title ? item.title : `${item.brand} ${item.name}`;

        li.innerHTML = `<span>${displayName}</span> 
        <button onclick="deleteItem('${item._id}', '${type}')" style="background-color: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Delete</button>`;
        container.appendChild(li);
    });
}

async function deleteItem(id, type) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
        const response = await fetch(`/api/admin/delete-${type}/${id}`, { method: 'DELETE' });
        
        if (response.ok) {
            alert('Item deleted successfully');
            loadLiveHardware(); //Refresh the lists after deletion
        } else {
            alert('Error deleting item');
        }
    } catch (err) {
        console.error('Error deleting item', err);
        alert('Network error during deletion');
    }
}

loadLiveHardware(); 