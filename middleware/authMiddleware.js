function requireAuth(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    return res.status(401).send('Not logged in');
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).send('Not logged in');
        }
        if (!roles.includes(req.session.role)) {
            return res.status(403).send('Forbidden');
        }
        next();
    };
}

const requireAdmin = requireRole('admin', 'superadmin');
const requireSuperAdmin = requireRole('superadmin');
const requireVendor = requireRole('vendor');

module.exports = { requireAuth, requireAdmin, requireSuperAdmin, requireVendor };