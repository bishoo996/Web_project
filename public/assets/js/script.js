// QUIZ DATA
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


// QUIZ 
let currentQuestion = 0;
let answers = [];

const quizQuestion = document.getElementById('quizQuestion');
const progressBar = document.getElementById('progressBar');
const questionCount = document.getElementById('questionCount');
const restartBtn = document.getElementById('restartBtn');

function showQuestion() {
    const q = questions[currentQuestion];

    let optionsHTML = '';
    q.options.forEach((option) => {
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

    const progress = (currentQuestion / questions.length) * 100;
    progressBar.style.width = progress + "%";
    questionCount.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
    restartBtn.style.display = 'none';
}

function selectAnswer(value) {
    answers.push(value);
    currentQuestion++;

    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        showResult();
    }
}

function getRecommendation() {
    const [usage, budget, form, performance] = answers;

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
        recommendation.name = form === 'laptop' ? "HP Pavilion 15" : "Office Desktop Pro";
        recommendation.description = "Intel i5-13400 · 16GB RAM · 512GB SSD";
        recommendation.price = "$719";
        recommendation.icon = "💼";
    }

    return recommendation;
}

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
            <button class="btn-primary btn-large" onclick="viewRecommendedProduct('${rec.name.replace(/'/g, "\\'")}')">View Product</button>
        </div>
    `;
}

function viewRecommendedProduct(productName) {
    // Try to find a matching product from our offers list
    const match = products.find(p =>
        productName.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (match) {
        // Open the modal with the matching product's details
        openProductModal(match.id);
    } else {
        // No exact match — scroll to offers section so user can browse
        document.getElementById('offers').scrollIntoView({ behavior: 'smooth' });
        showToast('Browse our available PCs below');
    }
}

function restartQuiz() {
    currentQuestion = 0;
    answers = [];
    showQuestion();
}

restartBtn.addEventListener('click', restartQuiz);

// RENDER PRODUCT CARDS
const offersGrid = document.getElementById('offersGrid');

// ==========================================
// HOMEPAGE DYNAMIC OFFERS GRID
// ==========================================
async function renderLiveProducts() {
    const offersGrid = document.getElementById('offersGrid');
    
    try {
        const response = await fetch('/api/products'); 
        const products = await response.json();

        let html = '';
        products.forEach(product => {
            html += `
                <div class="product-card" style="cursor: pointer;" onclick="window.location.href='product.html?id=${product._id}'">
                    <span class="badge-sale">${product.stockStatus.toUpperCase()}</span>
                    <div class="product-image">
                        <img src="${product.imageUrl || ''}" alt="${product.title}" onerror="this.style.display='none'">
                        <span class="image-fallback">📦</span>
                    </div>
                    <h3>${product.title}</h3>
                    <p class="product-specs">${product.manufacturer} | ${product.category.toUpperCase()}</p>
                    <div class="product-price">
                        <span class="new-price">$${product.price}</span>
                    </div>
                    <button class="btn-primary btn-full" onclick="event.stopPropagation(); alert('${product.title} added to cart!');">
                        Add to Cart
                    </button>
                </div>
            `;
        });

        offersGrid.innerHTML = html;
    } catch (error) {
        console.error('Failed to load home products', error);
    }
}

// Ensure this gets called at the bottom of script.js instead of the old function
renderLiveProducts();

// PRODUCT DETAIL MODAL
const modal = document.getElementById('productModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalFallback = document.getElementById('modalFallback');
const modalBadge = document.getElementById('modalBadge');
const modalName = document.getElementById('modalName');
const modalRating = document.getElementById('modalRating');
const modalDescription = document.getElementById('modalDescription');
const modalSpecsList = document.getElementById('modalSpecsList');
const modalOldPrice = document.getElementById('modalOldPrice');
const modalNewPrice = document.getElementById('modalNewPrice');
const modalAddToCart = document.getElementById('modalAddToCart');

let currentProduct = null;

function openProductModal(productId) {
    // Find the product by ID
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProduct = product;

    // Fill in modal with product data
    modalImage.src = product.image;
    modalImage.alt = product.name;
    modalImage.style.display = '';  // reset display in case previous image failed
    modalFallback.textContent = product.fallbackIcon;
    modalName.textContent = product.name;
    modalDescription.textContent = product.description;
    modalOldPrice.textContent = product.oldPrice;
    modalNewPrice.textContent = product.newPrice;

    // Badge
    modalBadge.textContent = product.badge;
    modalBadge.className = 'modal-badge ' + (product.badgeType === 'limited' ? 'limited' : 'sale');

    // Rating
    const stars = '⭐'.repeat(product.rating);
    modalRating.innerHTML = `${stars} <span>(${product.reviews} reviews)</span>`;

    // Full specs list
    let specsHTML = '';
    product.fullSpecs.forEach(spec => {
        specsHTML += `
            <li>
                <span class="spec-label">${spec.label}</span>
                <span class="spec-value">${spec.value}</span>
            </li>
        `;
    });
    modalSpecsList.innerHTML = specsHTML;

    // Show the modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';  // lock scrolling behind the modal
}

function closeProductModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeProductModal);

// Click outside the modal content to close
modal.addEventListener('click', function(e) {
    if (e.target === modal) {
        closeProductModal();
    }
});

// Press Escape to close
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeProductModal();
    }
});

// "Add to Cart" inside modal
modalAddToCart.addEventListener('click', function() {
    if (currentProduct) {
        showToast(`${currentProduct.name} added to cart ✓`);
        closeProductModal();
    }
});

// TOAST NOTIFICATION
const toast = document.getElementById('toast');
const toastMessage = toast.querySelector('.toast-message');
let toastTimeout;

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

document.querySelectorAll('.banner-buttons .btn-outline').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
    });
});

// START
renderProducts();
showQuestion();


async function configureNavigation() {
    try {
        const response = await fetch('/api/me');
        const userData = await response.json();

        if(userData.isLoggedIn && userData.role === 'admin') {
            const adminLink = document.getElementById('adminNavLink');
            if(adminLink) {
                adminLink.style.display = 'inline-block';
            }
        }

        if(userData.isLoggedIn) {
            document.getElementById('signInBtn').style.display = 'none';
            document.getElementById('signUpBtn').style.display = 'none';
        }
    }
    catch (error) {
        console.error('Error fetching user data for navigation', error);
    }

}

configureNavigation();