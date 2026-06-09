function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    // Send 401 for API routes, redirect for page routes
    if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    return res.redirect('/sign_in.html');
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ error: 'Not logged in' });
            }
            return res.redirect('/sign_in.html');
        }
        if (!roles.includes(req.session.role)) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            return res.redirect('/');
        }
        next();
    };
}
const egPhoneRegex = /^01[0125][0-9]{8}$/;
const requireAdmin = requireRole('admin', 'superadmin');
const requireSuperAdmin = requireRole('superadmin');
const requireVendor = requireRole('vendor');

module.exports = { requireAuth, requireAdmin, requireSuperAdmin, requireVendor };