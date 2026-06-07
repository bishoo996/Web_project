const express = require('express');
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

// Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);

// Hardware
router.get('/hardware', hardwareController.getHardware);
router.get('/categories', hardwareController.getCategories);

// Product browsing
router.get('/product/:id', productController.getProductById);
router.get('/products/:categoryName', productController.getProductsByCategory);
router.get('/products', productController.getProducts);

// Reviews & account activity
router.post('/product/:id/review', accountController.postReview);
router.get('/account/reviews', requireAuth, accountController.getAccountReviews);
router.delete('/account/reviews/:productId/:reviewId', requireAuth, accountController.deleteReview);
router.get('/account/wishlist', requireAuth, accountController.getWishlist);
router.post('/account/wishlist/:productId', requireAuth, accountController.toggleWishlist);
router.get('/account/recently-viewed', requireAuth, accountController.getRecentlyViewed);
router.post('/account/recently-viewed/:productId', requireAuth, accountController.saveRecentlyViewed);

// Cart
router.get('/cart', requireAuth, cartController.getCart);
router.post('/cart/add', requireAuth, cartController.addToCart);
router.get('/cart/count', requireAuth, cartController.getCartCount);
router.put('/cart/item/:productId', requireAuth, cartController.updateCartItem);
router.delete('/cart/item/:productId', requireAuth, cartController.removeCartItem);
router.delete('/cart', requireAuth, cartController.clearCart);

// Orders
router.post('/cart/checkout', requireAuth, orderController.checkout);
router.get('/account/orders', requireAuth, orderController.getAccountOrders);

// Benchmark
router.post('/benchmark/save', benchmarkController.saveBenchmark);
router.get('/benchmark/history', requireAuth, benchmarkController.getBenchmarkHistory);

// Admin product management
router.get('/admin/products', requireAdmin, productController.getAdminProducts);
router.post('/admin/add-product', requireSuperAdmin, productController.addAdminProduct);
router.put('/admin/edit-product/:id', requireAdmin, productController.editAdminProduct);
router.delete('/admin/delete-product/:id', requireAdmin, productController.deleteAdminProduct);

// Admin hardware management
router.post('/admin/add-cpu', requireAdmin, adminController.addCpu);
router.post('/admin/add-gpu', requireAdmin, adminController.addGpu);
router.post('/admin/add-game', requireAdmin, adminController.addGame);

// Admin users
router.get('/admin/users', requireAdmin, adminController.getUsers);
router.put('/admin/users/:id', requireAdmin, adminController.updateUser);
router.put('/admin/users/:id/role', requireSuperAdmin, adminController.updateUserRole);
router.delete('/admin/users/:id', requireAdmin, adminController.deleteUser);

// Admin orders and stats
router.get('/admin/orders', requireAdmin, adminController.getOrders);
router.get('/admin/product-stats', requireAdmin, adminController.getProductStats);
router.get('/admin/products/pending', requireAdmin, productController.getPendingProducts);
router.put('/admin/products/:id/approve', requireAdmin, productController.approveProduct);
router.put('/admin/products/:id/reject', requireAdmin, productController.rejectProduct);
router.put('/admin/orders/:id/status', requireAdmin, adminController.updateOrderStatus);

// Superadmin management
router.get('/superadmin/users', requireSuperAdmin, adminController.getSuperAdminUsers);
router.get('/superadmin/orders', requireSuperAdmin, adminController.getSuperAdminOrders);
router.post('/superadmin/categories', requireSuperAdmin, adminController.createCategory);
router.put('/superadmin/categories/:id', requireSuperAdmin, adminController.updateCategory);
router.delete('/superadmin/categories/:id', requireSuperAdmin, adminController.deleteCategory);

// Vendor routes
router.get('/vendor/products', requireVendor, vendorController.getVendorProducts);
router.post('/vendor/add-product', requireVendor, vendorController.addVendorProduct);
router.put('/vendor/orders/:orderId/item/:itemId/status', requireVendor, vendorController.updateOrderItemStatus);
router.put('/vendor/edit-product/:id', requireVendor, vendorController.editVendorProduct);
router.delete('/vendor/delete-product/:id', requireVendor, vendorController.deleteVendorProduct);
router.get('/vendor/sales-stats', requireVendor, vendorController.getVendorSalesStats);
router.get('/vendor/orders', requireVendor, vendorController.getVendorOrders);

module.exports = router;