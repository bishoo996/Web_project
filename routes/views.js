const path = require('path');
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, requireSuperAdmin, requireVendor } = require('../middleware/authMiddleware');

router.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/admin.html'));
});

router.get('/vendor', requireAuth, requireVendor, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/vendor.html'));
});

router.get('/superadmin', requireAuth, requireSuperAdmin, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/superadmin.html'));
});

module.exports = router;
