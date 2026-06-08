const Product = require('../models/Product');

async function getProductById(req, res) {
    try {
        const product = await Product.findById(req.params.id).populate('baselineHardwareId');
        if (!product) return res.status(404).send('Product not found');

        const viewerRole = req.session && req.session.role;
        const isOwner = req.session && product.vendorId && product.vendorId.toString() === req.session.userId?.toString();
        const isStaff = viewerRole === 'admin' || viewerRole === 'superadmin';

        if (product.approvalStatus !== 'approved' && !isOwner && !isStaff) {
            return res.status(404).send('Product not found');
        }

        res.json(product);
    } catch (err) {
        console.error('Error fetching single product:', err);
        res.status(500).send('Server error fetching product details');
    }
}

async function getProductsByCategory(req, res) {
    try {
        const products = await Product.find({ category: req.params.categoryName, approvalStatus: { $ne: 'rejected' } }).populate('baselineHardwareId');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products', err);
        res.status(500).send('Server error fetching products');
    }
}

async function getProducts(req, res) {
    try {
        const filter = { approvalStatus: { $ne: 'rejected' } };

        if (req.query.page) {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
            const [products, total] = await Promise.all([
                Product.find(filter).skip((page - 1) * limit).limit(limit),
                Product.countDocuments(filter)
            ]);
            return res.json({ products, total, page, totalPages: Math.ceil(total / limit) });
        }

        const products = await Product.find(filter);
        res.json(products);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).send('Server error fetching products');
    }
}

async function getAdminProducts(req, res) {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
}

async function addAdminProduct(req, res) {
    try {
        const product = new Product({ ...req.body, approvalStatus: 'approved' });
        await product.save();
        res.json({ success: true, message: 'Product saved successfully!', productId: product._id });
    } catch (err) {
        console.error('Error saving product:', err);
        res.status(500).send('Error saving product: ' + err.message);
    }
}

async function editAdminProduct(req, res) {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.send('Product updated!');
    } catch (err) {
        console.error('Error updating product', err);
        res.status(500).send('Error updating product');
    }
}

async function deleteAdminProduct(req, res) {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.send('Product deleted!');
    } catch (err) {
        console.error('Error deleting product', err);
        res.status(500).send('Error deleting product');
    }
}

async function getPendingProducts(req, res) {
    try {
        const products = await Product.find({ approvalStatus: 'pending' }).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        console.error('Error fetching pending products', err);
        res.status(500).send('Error fetching pending products');
    }
}

async function approveProduct(req, res) {
    try {
        await Product.findByIdAndUpdate(req.params.id, { approvalStatus: 'approved', moderationNotes: '' });
        res.send('Product approved!');
    } catch (err) {
        console.error('Error approving product', err);
        res.status(500).send('Error approving product');
    }
}

async function rejectProduct(req, res) {
    try {
        const { notes = '' } = req.body;
        await Product.findByIdAndUpdate(req.params.id, { approvalStatus: 'rejected', moderationNotes: notes });
        res.send('Product rejected!');
    } catch (err) {
        console.error('Error rejecting product', err);
        res.status(500).send('Error rejecting product');
    }
}

module.exports = {
    getProductById,
    getProductsByCategory,
    getProducts,
    getAdminProducts,
    addAdminProduct,
    editAdminProduct,
    deleteAdminProduct,
    getPendingProducts,
    approveProduct,
    rejectProduct
};