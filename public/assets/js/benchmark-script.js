// data el benchmark components
const componentData = {
    rtx4090: { performance: 98, memory: 95, power: 70, thermal: 75 },
    rtx4080: { performance: 88, memory: 90, power: 78, thermal: 80 },
    rx7900xtx: { performance: 85, memory: 88, power: 72, thermal: 77 },
    rtx4070: { performance: 78, memory: 82, power: 85, thermal: 88 },
    'i9-13900k': { performance: 95, memory: 90, power: 65, thermal: 70 },
    'i7-13700k': { performance: 85, memory: 85, power: 75, thermal: 78 },
    'ryzen9-7950x': { performance: 93, memory: 88, power: 70, thermal: 73 },
    'ryzen7-7700x': { performance: 82, memory: 83, power: 80, thermal: 82 }
};

// game data
const gameFpsData = {
    cyberpunk: {
        rtx4090: 120, rtx4080: 95, rx7900xtx: 88, rtx4070: 72,
        'i9-13900k': 110, 'i7-13700k': 95, 'ryzen9-7950x': 108, 'ryzen7-7700x': 92
    },
    rdr2: {
        rtx4090: 135, rtx4080: 110, rx7900xtx: 105, rtx4070: 85,
        'i9-13900k': 125, 'i7-13700k': 108, 'ryzen9-7950x': 122, 'ryzen7-7700x': 105
    },
    warzone: {
        rtx4090: 200, rtx4080: 165, rx7900xtx: 155, rtx4070: 130,
        'i9-13900k': 180, 'i7-13700k': 155, 'ryzen9-7950x': 175, 'ryzen7-7700x': 150
    },
    valorant: {
        rtx4090: 400, rtx4080: 380, rx7900xtx: 370, rtx4070: 340,
        'i9-13900k': 420, 'i7-13700k': 390, 'ryzen9-7950x': 410, 'ryzen7-7700x': 380
    },
    fortnite: {
        rtx4090: 240, rtx4080: 210, rx7900xtx: 200, rtx4070: 170,
        'i9-13900k': 230, 'i7-13700k': 200, 'ryzen9-7950x': 225, 'ryzen7-7700x': 195
    },
    'elden-ring': {
        rtx4090: 60, rtx4080: 60, rx7900xtx: 60, rtx4070: 60,
        'i9-13900k': 60, 'i7-13700k': 60, 'ryzen9-7950x': 60, 'ryzen7-7700x': 60
    }
};

const gpuSelect = document.getElementById('gpu-select');
const cpuSelect = document.getElementById('cpu-select');
const runBenchmarkBtn = document.getElementById('run-benchmark-btn');
const gameCards = document.querySelectorAll('.game-card');
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

runBenchmarkBtn.addEventListener('click', function() {
    const selectedGpu = gpuSelect.value;
    const selectedCpu = cpuSelect.value;
    
    if (!selectedGpu && !selectedCpu) {
        alert('Please select at least one component (GPU or CPU)');
        return;
    }
    
    const component = selectedGpu || selectedCpu;
    const scores = componentData[component];
    
    animateProgressBar(performanceBar, performanceScore, scores.performance);
    animateProgressBar(memoryBar, memoryScore, scores.memory);
    animateProgressBar(powerBar, powerScore, scores.power);
    animateProgressBar(thermalBar, thermalScore, scores.thermal);
});

// save selected value w validation
gameCards.forEach(card => {
    card.addEventListener('click', function() {
        const gameName = this.getAttribute('data-game');
        const selectedGpu = gpuSelect.value;
        const selectedCpu = cpuSelect.value;
        
        if (!selectedGpu && !selectedCpu) {
            alert('Please select a GPU or CPU first!');
            return;
        }
        
        const component = selectedGpu || selectedCpu;
        const fps = gameFpsData[gameName][component];
        
        fpsNumber.textContent = fps;
        selectedGameDisplay.textContent = this.querySelector('h3').textContent;
        
        gameCards.forEach(c => c.style.borderColor = 'transparent');
        this.style.borderColor = 'var(--primary-color)';
    });
});

// Part 6: Helper Functions
function animateProgressBar(barElement, scoreElement, targetScore) {
    barElement.style.width = '0%';
    
    setTimeout(() => {
        barElement.style.width = targetScore + '%';
        scoreElement.textContent = targetScore + '/100';
    }, 100);
}