const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, requireSuperAdmin, requireVendor } = require('../middleware/authMiddleware');

// Public pages
router.get(['/', '/index.html'], (req, res) => res.render('index'));
router.get('/category.html', (req, res) => res.render('category'));
router.get('/cart.html', (req, res) => res.render('cart'));
router.get('/product.html', (req, res) => res.render('product'));
router.get('/account.html', (req, res) => res.render('account'));
router.get('/benchmark.html', (req, res) => res.render('benchmark'));
router.get('/compare.html', (req, res) => res.render('compare'));
router.get('/builder_index.html', (req, res) => res.render('builder_index'));
router.get('/terms.html', (req, res) => res.render('terms'));
router.get('/sign_in.html', (req, res) => res.render('sign_in'));
router.get('/sign_up.html', (req, res) => res.render('sign_up'));

// Protected pages
router.get('/admin', requireAuth, requireAdmin, (req, res) => res.render('admin'));
router.get('/vendor', requireAuth, requireVendor, (req, res) => res.render('vendor'));
router.get('/superadmin', requireAuth, requireSuperAdmin, (req, res) => res.render('superadmin'));

module.exports = router;
