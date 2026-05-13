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
        cpuIntensive: document.getElementById('gameCpuIntensive').checked
    };
    handleFormSubmit(e, '/api/admin/add-game', payload, 'gameMessage');
});