const CPU = require('../models/CPU');
const GPU = require('../models/GPU');
const Game = require('../models/Game');
const User = require('../models/Users');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');

async function addCpu(req, res) {
    try {
        const cpu = new CPU(req.body);
        await cpu.save();
        res.send('CPU saved successfully!');
    } catch (err) {
        console.error('Error saving CPU', err);
        res.status(500).send('Error saving CPU: ' + err.message);
    }
}

async function addGpu(req, res) {
    try {
        const gpu = new GPU(req.body);
        await gpu.save();
        res.send('GPU saved successfully!');
    } catch (err) {
        console.error('Error saving GPU', err);
        res.status(500).send('Error saving GPU: ' + err.message);
    }
}

async function addGame(req, res) {
    try {
        const game = new Game(req.body);
        await game.save();
        res.send('Game saved successfully!');
    } catch (err) {
        console.error('Error saving Game', err);
        res.status(500).send('Error saving Game: ' + err.message);
    }
}

async function getUsers(req, res) {
    try {
        const query = req.session.role === 'admin' ? { role: { $in: ['customer', 'vendor'] } } : {};
        const users = await User.find(query).select('-password').sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users', err);
        res.status(500).send('Error fetching users');
    }
}

async function updateUser(req, res) {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).send('User not found');
        if (req.session.role === 'admin' && ['admin', 'superadmin'].includes(target.role)) {
            return res.status(403).send('Admins may only edit customers and vendors');
        }
        const allowed = (({ firstName, lastName, phoneNumber, address }) => ({ firstName, lastName, phoneNumber, address }))(req.body);
        await User.findByIdAndUpdate(req.params.id, allowed);
        res.send('User updated!');
    } catch (err) {
        console.error('Error updating user', err);
        res.status(500).send('Error updating user');
    }
}

async function updateUserRole(req, res) {
    try {
        const { role } = req.body;
        if (!['customer', 'vendor', 'admin', 'superadmin'].includes(role)) {
            return res.status(400).send('Invalid role');
        }
        await User.findByIdAndUpdate(req.params.id, { role });
        res.send('Role updated!');
    } catch (err) {
        console.error('Error updating role', err);
        res.status(500).send('Error updating role');
    }
}

async function deleteUser(req, res) {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).send('User not found');
        if (target._id.equals(req.session.userId)) {
            return res.status(400).send('Cannot delete your own account');
        }
        if (req.session.role === 'admin' && ['admin', 'superadmin'].includes(target.role)) {
            return res.status(403).send('Admins may only delete customers and vendors');
        }
        await User.findByIdAndDelete(req.params.id);
        res.send('User deleted!');
    } catch (err) {
        console.error('Error deleting user', err);
        res.status(500).send('Error deleting user');
    }
}

async function getOrders(req, res) {
    try {
        const orders = await Order.find().populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders', err);
        res.status(500).send('Error fetching orders');
    }
}

async function getProductStats(req, res) {
    try {
        const products = await Product.find();
        const orders = await Order.find();
        let sales = 0, revenue = 0, byProduct = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.title || 'Unknown Product';
                byProduct[key] = byProduct[key] || { quantity: 0, revenue: 0 };
                byProduct[key].quantity += item.quantity;
                byProduct[key].revenue += item.price * item.quantity;
                sales += item.quantity;
                revenue += item.price * item.quantity;
            });
        });
        res.json({
            totalSales: sales,
            totalRevenue: revenue,
            salesByProduct: byProduct,
            totalProducts: products.length,
            totalOrders: orders.length,
            approvedProducts: products.filter(p => p.approvalStatus === 'approved').length
        });
    } catch (err) {
        console.error('Error fetching product stats', err);
        res.status(500).send('Error fetching product stats');
    }
}

async function getSuperAdminUsers(req, res) {
    try {
        const users = await User.find().select('-password').sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users', err);
        res.status(500).send('Error fetching users');
    }
}

async function getSuperAdminOrders(req, res) {
    try {
        const orders = await Order.find().populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders', err);
        res.status(500).send('Error fetching orders');
    }
}

async function createCategory(req, res) {
    try {
        const { name, slug, description } = req.body;
        const category = new Category({ name, slug, description });
        await category.save();
        res.send('Category created!');
    } catch (err) {
        console.error('Error creating category', err);
        res.status(500).send('Error creating category');
    }
}

async function updateCategory(req, res) {
    try {
        await Category.findByIdAndUpdate(req.params.id, req.body);
        res.send('Category updated!');
    } catch (err) {
        console.error('Error updating category', err);
        res.status(500).send('Error updating category');
    }
}

async function deleteCategory(req, res) {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.send('Category deleted!');
    } catch (err) {
        console.error('Error deleting category', err);
        res.status(500).send('Error deleting category');
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.send('Status updated!');
    } catch (err) {
        console.error('Error updating order status', err);
        res.status(500).send('Error updating order status');
    }
}

module.exports = {
    addCpu,
    addGpu,
    addGame,
    getUsers,
    updateUser,
    updateUserRole,
    deleteUser,
    getOrders,
    getProductStats,
    getSuperAdminUsers,
    getSuperAdminOrders,
    createCategory,
    updateCategory,
    deleteCategory,
    updateOrderStatus
};