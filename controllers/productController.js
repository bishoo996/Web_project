const Product = require('../models/Product');

// 1. Function: getProductById
// B-tegy lma el user yd5ol 3ala saf7et product mo3ayan (Single Product Page).
async function getProductById(req, res) {
    try {
        // Bn-dawar 3ala el product bel ID bta3o, w .populate b-tgeeb tafaseel el hardware el asly lw mawgood (zay specs el GPU el aslya).
        const product = await Product.findById(req.params.id).populate('baselineHardwareId');
        if (!product) return res.status(404).send('Product not found');

        // SECURITY CHECK! 
        // Bn-shoof meen el by-7awel y-fta7 el product da.
        const viewerRole = req.session && req.session.role;
        // Hal el sha5s da hwa el vendor (el baya3) el nezal el product da?
        const isOwner = req.session && product.vendorId && product.vendorId.toString() === req.session.userId?.toString();
        // Hal el sha5s da admin aw superadmin mn el ta2em bta3na?
        const isStaff = viewerRole === 'admin' || viewerRole === 'superadmin';

        // Lw el product lsa "pending" (mt-wafeqsh 3aleh) aw "rejected", msh ay 7ad yshofo.
        // Bas el sa7eb el product (isOwner) w el admins (isStaff) y2daro yeshofoh 3ashan y-rage3oh.
        // Lw nta user 3ady, hy2olak 404 Not Found.
        if (product.approvalStatus !== 'approved' && !isOwner && !isStaff) {
            return res.status(404).send('Product not found');
        }

        res.json(product);
    } catch (err) {
        console.error('Error fetching single product:', err);
        res.status(500).send('Server error fetching product details');
    }
}

// 2. Function: getProductsByCategory
// B-tegy lma el user y-fta7 qesm mo3ayan (e.g., /category/gpu)
async function getProductsByCategory(req, res) {
    try {
        // Bn-hat kol el products el f category mo3ayan, w bs-shart enha MATKONSH "rejected".
        // (B-tgeeb el approved w momken el pending yezhar hna lw mfeesh filter tany f el front).
        const products = await Product.find({ category: req.params.categoryName, approvalStatus: { $ne: 'rejected' } }).populate('baselineHardwareId');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products', err);
        res.status(500).send('Server error fetching products');
    }
}

// 3. Function: getProducts
// B-tegy lma n3oz n-zher kol el products (Store page/Catalog). Fiha system Pagination (Saf7at).
async function getProducts(req, res) {
    try {
        // Filter asasy: Mat-zhrsh ay product "rejected".
        const filter = { approvalStatus: { $ne: 'rejected' } };

        // Lw el frontend ba3et "page" fl URL (e.g., ?page=2&limit=10)
        if (req.query.page) {
            const page = Math.max(1, parseInt(req.query.page) || 1); // Minimum page 1
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12)); // Max 50 item fl saf7a, default 12.
            
            // Promise.all hna 3ashan ne-fetch el products w n3ed-hom f nfs el waqt 3ashan neksab waqt.
            const [products, total] = await Promise.all([
                Product.find(filter).skip((page - 1) * limit).limit(limit), // .skip by-nott l saf7a el matlooba.
                Product.countDocuments(filter) // .count by-geeb 3adad el products kolha 3ashan n3rf 3ndna kam saf7a.
            ]);
            // Bn-eb3at el data ma3 m3lomat el saf7a (totalPages).
            return res.json({ products, total, page, totalPages: Math.ceil(total / limit) });
        }

        // Lw mfeesh pagination matloob, e-b3at kol el products (msh recommended lw el DB kbera awi).
        const products = await Product.find(filter);
        res.json(products);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).send('Server error fetching products');
    }
}

// ==========================================
// ADMIN PORTAL FUNCTIONS (Mn awel hna el shoghl lel admins bas)
// ==========================================

// 4. Function: getAdminProducts
async function getAdminProducts(req, res) {
    try {
        // Bn-geeb KOL el products (7ata el rejected wel pending) w n-ratibhom mn el a7das lel aqdam (-1).
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
}

// 5. Function: addAdminProduct
// Lma el Admin y-da5al product b2edo.
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

// 6. Function: editAdminProduct
async function editAdminProduct(req, res) {
    try {
        // Bn-update product mawgood aslan (e.g., t8yer se3r aw sora).
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.send('Product updated!');
    } catch (err) {
        console.error('Error updating product', err);
        res.status(500).send('Error updating product');
    }
}

// 7. Function: deleteAdminProduct
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

// ==========================================
// VENDOR MODERATION (Mrag3et shoghl el tugar)
// ==========================================

// 8. Function: getPendingProducts
// B-trg3 el products el mstneya tat-wafeq 3aleha.
async function getPendingProducts(req, res) {
    try {
        const products = await Product.find({ approvalStatus: 'pending' }).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        console.error('Error fetching pending products', err);
        res.status(500).send('Error fetching pending products');
    }
}

// 9. Function: approveProduct
// Lma el Admin y-doos "Approve" 3ala product bta3 vendor.
async function approveProduct(req, res) {
    try {
        // Bn-8yr el status l 'approved' w bn-msa7 ay mola7zat adema (moderationNotes: '').
        await Product.findByIdAndUpdate(req.params.id, { approvalStatus: 'approved', moderationNotes: '' });
        res.send('Product approved!');
    } catch (err) {
        console.error('Error approving product', err);
        res.status(500).send('Error approving product');
    }
}

// 10. Function: rejectProduct
// Lma el Admin y-rfoz product bta3 vendor w yekteblo el sabab.
async function rejectProduct(req, res) {
    try {
        // Bn-a5od el sabab mn el req.body (notes). Lw matb3tsh bsabeb, htb2a fadya ''.
        const { notes = '' } = req.body;
        // Bn-8yr el status l 'rejected' w nsgl el sabab 3ashan el vendor yshofo.
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