
// ==========================================
// HOMEPAGE DYNAMIC OFFERS GRID
// ==========================================
async function renderLiveProducts() {
    const offersGrid = document.getElementById('offersGrid');
    const featuredCategory = 'cpu';
    const featuredUrl = `/api/products/${featuredCategory}`;

    try {
        let response = await fetch(featuredUrl);
        let products = await response.json();

        if (!Array.isArray(products) || products.length === 0) {
            response = await fetch('/api/products');
            products = await response.json();
        }

        products = Array.isArray(products) ? products.slice(0, 8) : [];

        let html = '';
        products.forEach(product => {
            html += `
                <div class="product-card" style="cursor: pointer;" onclick="window.location.href='product.html?id=${product._id}'">
                    <span class="badge-sale">${(product.stockStatus || 'IN').toString().toUpperCase()}</span>
                    <div class="product-image">
                        <img src="${product.imageUrl || ''}" alt="${product.title}" onerror="this.style.display='none'">
                        <span class="image-fallback"><span class="material-icons icon-inline" aria-hidden="true">inventory_2</span></span>
                    </div>
                    <h3>${product.title}</h3>
                    <p class="product-specs">${product.manufacturer} | ${product.category.toUpperCase()}</p>
                    <div class="product-price">
                        <span class="new-price">$${product.price}</span>
                    </div>
                    <button class="btn-primary btn-full" onclick="event.stopPropagation(); CartWidget.add('${product._id}', 1, event);">
                        Add to Cart
                    </button>
                </div>
            `;
        });

        offersGrid.innerHTML = html;
    } catch (error) {
        console.error('Failed to load featured category products', error);
        offersGrid.innerHTML = '<p class="error-message">Unable to load featured products right now.</p>';
    }
}

// Ensure this gets called at the bottom of script.js instead of the old function
renderLiveProducts();


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
showQuestion();


async function configureNavigation() {
    try {
        const response = await fetch('/api/me');
        const userData = await response.json();

        if(userData.isLoggedIn && (userData.role === 'admin' || userData.role === 'superadmin')) {
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