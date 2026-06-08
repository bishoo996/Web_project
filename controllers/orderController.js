// Order controller handles checkout flow and order history retrieval.
// It uses the Cart model to read purchased items and the Order model to record completed purchases.
const Cart = require('../models/Cart');
const Order = require('../models/Order');

async function checkout(req, res) {
    // Convert the user's cart into a saved order record.
    try {
        const { shippingAddress = '', paymentMethod = 'card', notes = '' } = req.body;
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }

        const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const expandedItems = cart.items.map(item => ({
            productId: item.productId,
            title: item.title,
            manufacturer: item.manufacturer,
            imageUrl: item.imageUrl,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
            vendorId: item.vendorId,
            fulfillmentStatus: 'pending'
        }));

        const order = new Order({
            userId: req.session.userId,
            items: expandedItems,
            total,
            shippingAddress,
            paymentMethod,
            notes
        });

        await order.save();
        cart.items = [];
        await cart.save();
        res.json({ success: true, orderId: order._id });
    } catch (err) {
        console.error('Error during checkout', err);
        res.status(500).json({ error: 'Checkout error' });
    }
}

async function getAccountOrders(req, res) {
    // Return all orders belonging to the authenticated user.
    try {
        const orders = await Order.find({ userId: req.session.userId });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching account orders', err);
        res.status(500).json({ error: 'Error fetching orders' });
    }
}

module.exports = { checkout, getAccountOrders };