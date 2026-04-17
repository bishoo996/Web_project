

// Quiz questions and options
const questions = [
    {
        question: "What will you mainly use your PC for?",
        options: [
            { text: "Gaming", icon: "🎮", value: "gaming" },
            { text: "Work / Office", icon: "💼", value: "office" },
            { text: "Programming", icon: "💻", value: "programming" },
            { text: "Content Creation", icon: "🎬", value: "creation" }
        ]
    },
    {
        question: "What is your budget?",
        options: [
            { text: "Under $800", icon: "💰", value: "low" },
            { text: "$800 - $1500", icon: "💵", value: "mid" },
            { text: "$1500 - $2500", icon: "💸", value: "high" },
            { text: "$2500+", icon: "🤑", value: "premium" }
        ]
    },
    {
        question: "Do you prefer a desktop or laptop?",
        options: [
            { text: "Desktop", icon: "🖥️", value: "desktop" },
            { text: "Laptop", icon: "💻", value: "laptop" }
        ]
    },
    {
        question: "How important is performance to you?",
        options: [
            { text: "Basic is fine", icon: "🙂", value: "basic" },
            { text: "Good balance", icon: "👍", value: "balanced" },
            { text: "Maximum power", icon: "🚀", value: "max" }
        ]
    }
];

// Quiz state
let currentQuestion = 0;
let answers = [];

// DOM elements
const quizQuestion = document.getElementById('quizQuestion');
const progressBar = document.getElementById('progressBar');
const questionCount = document.getElementById('questionCount');
const restartBtn = document.getElementById('restartBtn');

// Show current question
function showQuestion() {
    const q = questions[currentQuestion];

    let optionsHTML = '';
    q.options.forEach((option, index) => {
        optionsHTML += `
            <button class="quiz-option" onclick="selectAnswer('${option.value}')">
                <span class="option-icon">${option.icon}</span>
                ${option.text}
            </button>
        `;
    });

    quizQuestion.innerHTML = `
        <h3>${q.question}</h3>
        <div class="quiz-options">
            ${optionsHTML}
        </div>
    `;

    // Update progress
    const progress = ((currentQuestion) / questions.length) * 100;
    progressBar.style.width = progress + "%";
    questionCount.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
    restartBtn.style.display = 'none';
}

// Handle answer selection
function selectAnswer(value) {
    answers.push(value);
    currentQuestion++;

    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

// Generate recommendation based on answers
function getRecommendation() {
    const [usage, budget, form, performance] = answers;

    // Simple recommendation logic
    let recommendation = {
        title: "Your Perfect PC",
        icon: "💻",
        name: "",
        description: "",
        price: ""
    };

    if (usage === 'gaming') {
        if (budget === 'premium' || performance === 'max') {
            recommendation.name = form === 'laptop' ? "ROG Strix Scar 18" : "Alienware Aurora R16";
            recommendation.description = "RTX 4090 · Intel i9-14900K · 32GB DDR5 RAM";
            recommendation.price = "$3,499";
            recommendation.icon = "🎮";
        } else if (budget === 'high') {
            recommendation.name = form === 'laptop' ? "Acer Predator Helios 16" : "Custom Gaming Rig Pro";
            recommendation.description = "RTX 4070 Ti · Ryzen 7 7700X · 32GB RAM";
            recommendation.price = "$1,899";
            recommendation.icon = "🎮";
        } else {
            recommendation.name = form === 'laptop' ? "Lenovo Legion 5" : "Budget Gaming Desktop";
            recommendation.description = "RTX 4060 · Ryzen 5 7600 · 16GB RAM";
            recommendation.price = "$1,099";
            recommendation.icon = "🎮";
        }
    } else if (usage === 'programming') {
        if (budget === 'premium' || budget === 'high') {
            recommendation.name = form === 'laptop' ? "MacBook Pro 14\" M3 Pro" : "Dev Workstation Pro";
            recommendation.description = "M3 Pro · 32GB RAM · 1TB SSD";
            recommendation.price = "$2,199";
            recommendation.icon = "💻";
        } else {
            recommendation.name = form === 'laptop' ? "ThinkPad T14" : "Dev Starter Desktop";
            recommendation.description = "Intel i7-13700 · 16GB RAM · 512GB SSD";
            recommendation.price = "$1,099";
            recommendation.icon = "💻";
        }
    } else if (usage === 'creation') {
        recommendation.name = form === 'laptop' ? "MacBook Pro 16\" M3 Max" : "Creator Workstation";
        recommendation.description = "M3 Max · 36GB RAM · 1TB SSD · ProRes Engine";
        recommendation.price = budget === 'premium' ? "$3,499" : "$2,499";
        recommendation.icon = "🎬";
    } else {
        // Office / general use
        recommendation.name = form === 'laptop' ? "HP Pavilion 15" : "Office Desktop Pro";
        recommendation.description = "Intel i5-13400 · 16GB RAM · 512GB SSD";
        recommendation.price = "$719";
        recommendation.icon = "💼";
    }

    return recommendation;
}

// Show final result
function showResult() {
    const rec = getRecommendation();

    progressBar.style.width = "100%";
    questionCount.textContent = "Quiz Complete!";
    restartBtn.style.display = 'inline-block';

    quizQuestion.innerHTML = `
        <div class="quiz-result">
            <div class="result-icon">${rec.icon}</div>
            <h3>We Found Your Perfect Match!</h3>
            <p>Based on your answers, we recommend:</p>
            <div class="recommendation-card">
                <h4>${rec.name}</h4>
                <p>${rec.description}</p>
                <div class="card-price" style="justify-content: center; margin-top: 12px;">
                    <span class="new-price">${rec.price}</span>
                </div>
            </div>
            <button class="btn-primary btn-large">View Product</button>
        </div>
    `;
}

// Restart quiz
function restartQuiz() {
    currentQuestion = 0;
    answers = [];
    showQuestion();
}

// Event listeners
restartBtn.addEventListener('click', restartQuiz);

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// "Take the Quiz" button in banner scrolls to quiz section
document.querySelectorAll('.banner-buttons .btn-outline').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
    });
});

// Start the quiz on page load
showQuestion();