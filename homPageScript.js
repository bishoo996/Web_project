async function renderLiveProducts() {
    const offersGrid = document.getElementById('offersGrid');
    if (!offersGrid) return;

    const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
    const featuredCategory = 'cpu';
    const featuredUrl = `${apiBase}/api/products/${featuredCategory}`;

    try {
        let response = await fetch(featuredUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch featured products: ${response.status}`);
        }

        let products = await response.json();

        if (!Array.isArray(products) || products.length === 0) {
            response = await fetch(`${apiBase}/api/products`);
            products = await response.json();
        }

        products = Array.isArray(products) ? products.slice(0, 8) : [];

        if (products.length === 0) {
            offersGrid.innerHTML = '<p class="error-message">No featured products available right now.</p>';
            return;
        }

        offersGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.imageUrl || ''}" alt="${product.title}" onerror="this.style.display='none'">
                </div>
                <h3>${product.title}</h3>
                <p>${product.manufacturer} · ${product.category}</p>
                <p class="product-price">$${product.price}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load featured products:', error);
        offersGrid.innerHTML = '<p class="error-message">Unable to load featured products right now.</p>';
    }
}

window.addEventListener('DOMContentLoaded', renderLiveProducts);
