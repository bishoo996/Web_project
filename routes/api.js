const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const authController = require('../controllers/authController');
const hardwareController = require('../controllers/hardwareController');
const productController = require('../controllers/productController');
const accountController = require('../controllers/accountController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const benchmarkController = require('../controllers/benchmarkController');
const adminController = require('../controllers/adminController');
const vendorController = require('../controllers/vendorController');
const { requireAuth, requireAdmin, requireSuperAdmin, requireVendor } = require('../middleware/authMiddleware');




const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });




const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, `${timestamp}-${safeName}`);
    }
});



const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image uploads are allowed'));
        }
        cb(null, true);
    }
});

// ─── Auth ────────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

// ─── Hardware ────────────────────────────────────────────────────
router.get('/hardware', hardwareController.getHardware);
router.get('/categories', hardwareController.getCategories);

// ─── Product browsing ────────────────────────────────────────────
router.get('/product/:id', productController.getProductById);
router.get('/products/:categoryName', productController.getProductsByCategory);
router.get('/products', productController.getProducts);

// ─── Account profile ─────────────────────────────────────────────
router.get('/account/profile', requireAuth, accountController.getProfile);
router.put('/account/profile', requireAuth, accountController.updateProfile);
router.put('/account/password', requireAuth, accountController.updatePassword);

// ─── Reviews & account activity ──────────────────────────────────
router.post('/product/:id/review', accountController.postReview);
router.get('/account/reviews', requireAuth, accountController.getAccountReviews);
router.delete('/account/reviews/:productId/:reviewId', requireAuth, accountController.deleteReview);
router.get('/account/wishlist', requireAuth, accountController.getWishlist);
router.post('/account/wishlist/:productId', requireAuth, accountController.toggleWishlist);
router.get('/account/recently-viewed', requireAuth, accountController.getRecentlyViewed);
router.post('/account/recently-viewed/:productId', requireAuth, accountController.saveRecentlyViewed);

// ─── Cart ────────────────────────────────────────────────────────
router.get('/cart', requireAuth, cartController.getCart);
router.post('/cart/add', requireAuth, cartController.addToCart);
router.get('/cart/count', requireAuth, cartController.getCartCount);
router.put('/cart/item/:productId', requireAuth, cartController.updateCartItem);
router.delete('/cart/item/:productId', requireAuth, cartController.removeCartItem);
router.delete('/cart', requireAuth, cartController.clearCart);

// ─── Orders ──────────────────────────────────────────────────────
router.post('/cart/checkout', requireAuth, orderController.checkout);
router.get('/account/orders', requireAuth, orderController.getAccountOrders);

// ─── Benchmark ───────────────────────────────────────────────────
router.post('/benchmark/save', benchmarkController.saveBenchmark);
router.get('/benchmark/history', requireAuth, benchmarkController.getBenchmarkHistory);

// ─── Admin product management ────────────────────────────────────
router.get('/admin/products', requireAdmin, productController.getAdminProducts);
router.post('/admin/add-product', requireSuperAdmin, productController.addAdminProduct);
router.post('/admin/upload-image', requireAdmin, upload.single('image'), vendorController.uploadProductImage);
router.put('/admin/edit-product/:id', requireAdmin, productController.editAdminProduct);
router.delete('/admin/delete-product/:id', requireAdmin, productController.deleteAdminProduct);

// ─── Admin hardware management ───────────────────────────────────
router.post('/admin/add-cpu', requireAdmin, adminController.addCpu);
router.post('/admin/add-gpu', requireAdmin, adminController.addGpu);
router.post('/admin/add-game', requireAdmin, adminController.addGame);

// ─── Admin users ─────────────────────────────────────────────────
router.get('/admin/users', requireAdmin, adminController.getUsers);
router.put('/admin/users/:id', requireAdmin, adminController.updateUser);
router.put('/admin/users/:id/role', requireSuperAdmin, adminController.updateUserRole);
router.delete('/admin/users/:id', requireAdmin, adminController.deleteUser);

// ─── Admin orders and stats ──────────────────────────────────────
router.get('/admin/orders', requireAdmin, adminController.getOrders);
router.get('/admin/product-stats', requireAdmin, adminController.getProductStats);
router.get('/admin/products/pending', requireAdmin, productController.getPendingProducts);
router.put('/admin/products/:id/approve', requireAdmin, productController.approveProduct);
router.put('/admin/products/:id/reject', requireAdmin, productController.rejectProduct);
router.put('/admin/orders/:id/status', requireAdmin, adminController.updateOrderStatus);

// ─── Superadmin management ───────────────────────────────────────
router.get('/superadmin/users', requireSuperAdmin, adminController.getSuperAdminUsers);
router.get('/superadmin/orders', requireSuperAdmin, adminController.getSuperAdminOrders);
router.post('/superadmin/categories', requireSuperAdmin, adminController.createCategory);
router.put('/superadmin/categories/:id', requireSuperAdmin, adminController.updateCategory);
router.delete('/superadmin/categories/:id', requireSuperAdmin, adminController.deleteCategory);

// ─── Vendor routes ───────────────────────────────────────────────
router.get('/vendor/products', requireVendor, vendorController.getVendorProducts);
router.post('/vendor/add-product', requireVendor, vendorController.addVendorProduct);
router.post('/vendor/upload-image', requireVendor, upload.single('image'), vendorController.uploadProductImage);
router.put('/vendor/orders/:orderId/item/:itemId/status', requireVendor, vendorController.updateOrderItemStatus);
router.put('/vendor/edit-product/:id', requireVendor, vendorController.editVendorProduct);
router.delete('/vendor/delete-product/:id', requireVendor, vendorController.deleteVendorProduct);
router.get('/vendor/sales-stats', requireVendor, vendorController.getVendorSalesStats);
router.get('/vendor/orders', requireVendor, vendorController.getVendorOrders);


// ─── Contact Email (External API) ──────────────────
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).json({ error: 'All fields are required' });

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: process.env.SENDGRID_FROM }] }],
                from: { email: process.env.SENDGRID_FROM, name: 'PC Marketplace' },
                subject: `New message from ${name}`,
                content: [{
                    type: 'text/html',
                    value: `<p><b>From:</b> ${name} (${email})</p><p>${message}</p>`
                }]
            })
        });

        if (response.ok) {
            res.json({ success: true, message: 'Email sent!' });
        } else {
            const err = await response.json();
            res.status(500).json({ error: err.errors?.[0]?.message || 'Failed to send email' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to send email' });
    }
});

module.exports = router;