const Product = require('../models/Product');
const Order = require('../models/Order');

async function getVendorProducts(req, res) {
    try {
        const products = await Product.find({ vendorId: req.session.userId }).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        console.error('Error fetching vendor products', err);
        res.status(500).json({ error: 'Error fetching products' });
    }
}

async function addVendorProduct(req, res) {
    try {
        const supplierName = req.session.companyName || `${req.session.firstName} ${req.session.lastName}`;
        await new Product({ ...req.body, supplierName, vendorId: req.session.userId, approvalStatus: 'pending' }).save();
        res.json({ message: 'Product saved successfully!' });
    } catch (err) {
        console.error('Error saving product', err);
        res.status(500).json({ error: 'Error saving product: ' + err.message });
    }
}

async function uploadProductImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (err) {
        console.error('Error uploading product image', err);
        res.status(500).json({ error: 'Error uploading image' });
    }
}

async function updateOrderItemStatus(req, res) {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const item = order.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ error: 'Order item not found' });
        if (!item.vendorId || item.vendorId.toString() !== req.session.userId.toString()) {
            return res.status(403).json({ error: 'Cannot modify this item' });
        }

        item.fulfillmentStatus = status;
        await order.save();
        res.json({ message: 'Item fulfillment status updated!' });
    } catch (err) {
        console.error('Error updating item status', err);
        res.status(500).json({ error: 'Error updating item status' });
    }
}

async function editVendorProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || product.vendorId.toString() !== req.session.userId.toString()) {
            return res.status(403).json({ error: 'Not your product' });
        }
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Product updated!' });
    } catch (err) {
        console.error('Error updating product', err);
        res.status(500).json({ error: 'Error updating product' });
    }
}

async function deleteVendorProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || product.vendorId.toString() !== req.session.userId.toString()) {
            return res.status(403).json({ error: 'Not your product' });
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted!' });
    } catch (err) {
        console.error('Error deleting product', err);
        res.status(500).json({ error: 'Error deleting product' });
    }
}

async function getVendorSalesStats(req, res) {
    try {
        const products = await Product.find({ vendorId: req.session.userId });
        const ids = products.map(p => p._id);
        const orders = await Order.find({ 'items.productId': { $in: ids } });

        let sales = 0, revenue = 0, byProduct = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (ids.some(id => id.equals(item.productId))) {
                    const key = item.title;
                    byProduct[key] = byProduct[key] || { quantity: 0, revenue: 0 };
                    byProduct[key].quantity += item.quantity;
                    byProduct[key].revenue += item.price * item.quantity;
                    sales += item.quantity;
                    revenue += item.price * item.quantity;
                }
            });
        });

        res.json({
            totalSales: sales,
            totalRevenue: revenue,
            salesByProduct: byProduct,
            totalProducts: products.length,
            totalOrders: orders.length
        });
    } catch (err) {
        console.error('Error fetching vendor sales stats', err);
        res.status(500).json({ error: 'Error fetching stats' });
    }
}

async function getVendorOrders(req, res) {
    try {
        const products = await Product.find({ vendorId: req.session.userId });
        const ids = products.map(p => p._id);
        const orders = await Order.find({ 'items.productId': { $in: ids } })
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json(orders.map(order => ({
            ...order.toObject(),
            items: order.items.filter(item => ids.some(id => id.equals(item.productId)))
        })));
    } catch (err) {
        console.error('Error fetching vendor orders', err);
        res.status(500).json({ error: 'Error fetching orders' });
    }
}

module.exports = {
    getVendorProducts,
    addVendorProduct,
    uploadProductImage,
    updateOrderItemStatus,
    editVendorProduct,
    deleteVendorProduct,
    getVendorSalesStats,
    getVendorOrders
};