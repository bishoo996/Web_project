// Cart controller handles authenticated cart interactions through API endpoints.
// It uses the Cart and Product models to read, update, and persist cart state.
const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function getCart(req, res) {
    // Return the authenticated user's cart. If no cart exists yet, return an empty cart shape.
    try {
        let cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        if (!cart) cart = { items: [] };
        res.json(cart);
    } catch (err) {
        console.error('Error fetching cart', err);
        res.status(500).json({ error: 'Cart error' });
    }
}

async function addToCart(req, res) {
    // Add a product to the authenticated user's cart. If the item already exists,
    // increment quantity; otherwise add a new item entry.
    try {
        const { productId, quantity = 1 } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) cart = new Cart({ userId: req.session.userId, items: [] });

        const existing = cart.items.find(i => i.productId.toString() === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                title: product.title,
                manufacturer: product.manufacturer || '',
                imageUrl: product.imageUrl || '',
                price: product.price,
                category: product.category || '',
                quantity,
                vendorId: product.vendorId
            });
        }

        await cart.save();
        const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
        res.json({ success: true, itemCount });
    } catch (err) {
        console.error('Error adding to cart', err);
        res.status(500).json({ error: 'Add to cart error' });
    }
}

async function getCartCount(req, res) {
    // Return only the total item count for the current user's cart.
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        const count = cart ? cart.items.reduce((sum, i) => sum + i.quantity, 0) : 0;
        res.json({ count });
    } catch (err) {
        console.error('Error fetching cart count', err);
        res.status(500).json({ count: 0 });
    }
}

async function updateCartItem(req, res) {
    // Update the quantity for a specific item in the user's cart.
    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const item = cart.items.find(i => i.productId.toString() === req.params.productId);
        if (!item) return res.status(404).json({ error: 'Item not in cart' });

        item.quantity = quantity;
        await cart.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating cart item', err);
        res.status(500).json({ error: 'Update error' });
    }
}

async function removeCartItem(req, res) {
    // Delete a single item from the user's cart.
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
        await cart.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error removing cart item', err);
        res.status(500).json({ error: 'Remove error' });
    }
}

async function clearCart(req, res) {
    // Remove all items from the authenticated user's cart.
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error clearing cart', err);
        res.status(500).json({ error: 'Clear cart error' });
    }
}

module.exports = { getCart, addToCart, getCartCount, updateCartItem, removeCartItem, clearCart };