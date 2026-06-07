let dbHardware = {  //store el DB data, act as cash so we dont pull from DB every time
    cpus: [],
    gpus: [],
    games: []
};

const gpuSelect = document.getElementById('gpu-select');
const cpuSelect = document.getElementById('cpu-select');
const runBenchmarkBtn = document.getElementById('run-benchmark-btn');
const fpsNumber = document.getElementById('fps-number');
const selectedGameDisplay = document.getElementById('selected-game');

const performanceBar = document.getElementById('performance-bar');
const memoryBar = document.getElementById('memory-bar');
const powerBar = document.getElementById('power-bar');
const thermalBar = document.getElementById('thermal-bar');

const performanceScore = document.getElementById('performance-score');
const memoryScore = document.getElementById('memory-score');
const powerScore = document.getElementById('power-score');
const thermalScore = document.getElementById('thermal-score');


async function loadLiveHardware() {  //fetch DB data and populate dropdowns
    try {
        const response = await fetch('/api/hardware');
        const data = await response.json();
        dbHardware = data; //save to global state so our buttons can access the math variables later
        

        //clear existing dropdowns
        cpuSelect.innerHTML = '<option value="">-- Select CPU --</option>';
        gpuSelect.innerHTML = '<option value="">-- Select GPU --</option>';

        //populate dropdowns
        data.cpus.forEach(cpu => {
            const option = document.createElement('option');
            option.value = cpu._id; // Store the MongoDB ID!
            option.textContent = `${cpu.brand} ${cpu.name}`;
            cpuSelect.appendChild(option);
        });

        
        data.gpus.forEach(gpu => {
            const option = document.createElement('option');
            option.value = gpu._id;
            option.textContent = `${gpu.brand} ${gpu.name} (${gpu.vram}GB)`;
            gpuSelect.appendChild(option);
        });

        const gameGrid = document.getElementById('dynamic-game-grid');
        gameGrid.innerHTML = ''; //Clear existing cards

        data.games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card'; //34an CSS styling
            
            card.innerHTML = `
                <img src="${game.imageUrl}" alt="${game.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 5px;">
                <h3 style="text-align: center; margin: 10px;">${game.title}</h3>
            `;
            
            card.addEventListener('click', function() {
                const selectedGpuId = gpuSelect.value;
                const selectedCpuId = cpuSelect.value;
                
                if (!selectedGpuId || !selectedCpuId) {
                    alert('Please select both a GPU and CPU first!');
                    return;
                }

                const cpu = dbHardware.cpus.find(c => c._id === selectedCpuId);
                const gpu = dbHardware.gpus.find(g => g._id === selectedGpuId);

                let rawFps = gpu.renderScores.p1080;
                let cpuMultiplier = cpu.computeScore / 100;
                if (game.cpuIntensive) {
                    cpuMultiplier = cpuMultiplier * 1.2;
                }
                let finalFps = Math.floor(rawFps * Math.min(cpuMultiplier, 1.0) * game.optimizationFactor);

                fpsNumber.textContent = finalFps;
                selectedGameDisplay.textContent = game.title;

                document.querySelectorAll('.game-card').forEach(c => c.style.borderColor = 'transparent');
                this.style.borderColor = 'var(--primary-color)';
            });

            gameGrid.appendChild(card);
        });

        console.log("Database successfully loaded into frontend!");
    } catch (error) {
        console.error("Failed to load hardware:", error);
    }
}

// 4. Update Progress Bars on Benchmark Click
runBenchmarkBtn.addEventListener('click', function() {
    const selectedGpuId = gpuSelect.value;
    const selectedCpuId = cpuSelect.value;
    
    if (!selectedGpuId || !selectedCpuId) {
        alert('Please select BOTH a CPU and a GPU to run the benchmark.');
        return;
    }
    
    // Find the actual hardware objects in our global array using the MongoDB ID
    const cpu = dbHardware.cpus.find(c => c._id === selectedCpuId);
    const gpu = dbHardware.gpus.find(g => g._id === selectedGpuId);
    
   
    // erformance: We average the CPU compute score and GPU 1440p score
    const avgPerformance = Math.floor((cpu.computeScore + gpu.renderScores.p1440) / 2);
    
    // Memory: Scale VRAM to a 100% bar (assuming 24GB is max/100%)
    const memoryPercentage = Math.min(Math.floor((gpu.vram / 24) * 100), 100);
    
    animateProgressBar(performanceBar, performanceScore, Math.min(avgPerformance, 100));
    animateProgressBar(memoryBar, memoryScore, memoryPercentage);
    
    //Power/Thermal aren't in DB yet, this is mock data
    animateProgressBar(powerBar, powerScore, 85); 
    animateProgressBar(thermalBar, thermalScore, 78);
});


function animateProgressBar(barElement, scoreElement, targetScore) {
    barElement.style.width = '0%';
    setTimeout(() => {
        barElement.style.width = targetScore + '%';
        scoreElement.textContent = targetScore + '/100';
    }, 100);
}

// Expose refresh function globally so admin.js can call it
window.refreshBenchmarkData = loadLiveHardware;

loadLiveHardware();