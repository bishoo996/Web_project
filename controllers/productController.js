const Product = require('../models/Product');

// Single Product Page
async function getProductById(req, res) {
    try {
        const product = await Product.findById(req.params.id).populate('baselineHardwareId'); // Populate baseline hardware beygeeb el details el asleya law linked using ref fl models
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

// (e.g., /category/gpu)
async function getProductsByCategory(req, res) {
    try {
        const products = await Product.find({ category: req.params.categoryName, approvalStatus: { $ne: 'rejected' } }).populate('baselineHardwareId');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products', err);
        res.status(500).send('Server error fetching products');
    }
}


// Beteegy lma n3oz nzher kol el products Store page/Catalog. Fiha system Pagination Saf7at.
async function getProducts(req, res) {
    try {
        // Filter asasy: Mat-zhrsh ay product "rejected".
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
        // Bn-geeb KOL el products (7ata el rejected wel pending) w neratibhom mn el new lel old .
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
}

async function addAdminProduct(req, res) {
    try {
        // Ay product el admin by-da5alo bykoon "approved" mn 8er mrag3a, l2n da el modir bta3 el site.
        const product = new Product({ ...req.body, approvalStatus: 'approved' });
        await product.save();
        res.send('Product saved successfully!');
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
        // Bn-msa7 el product kaman mn el DB.
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

// Lma el Admin y-doos "Approve" 3ala product bta3 vendor.
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
        // Bn-a5od el sabab mn el req.body (notes). Lw matb3tsh bsabeb, htb2a fadya ''.
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