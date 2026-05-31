const path = require('path');
const express = require('express'); //Express el framework el bey simplify el server creation w routing w handling requests
const mongoose = require('mongoose'); //mongoose el bouncer el bey enforce el schema w el validation
const bcrypt = require('bcrypt'); //hash passwords for security
const session = require('express-session'); //handle user sessions


//import models
const CPU = require('./models/CPU'); 
const GPU = require('./models/GPU');
const Game = require('./models/Game');
const User = require('./models/Users'); 
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Category = require('./models/Category');
const BenchmarkResult = require('./models/BenchmarkResult');


const app = express();
const PORT = 3000;


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 1000 * 60 * 60 * 24 
    } 
}));

app.use((req, res, next) => {
    if (['/admin.html', '/vendor.html', '/superadmin.html'].includes(req.path)) {
        return res.status(403).send('Forbidden');
    }
    next();
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect('mongodb://localhost:27017/web_projectDB')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Could not connect to MongoDB', err));


/* ========================= AUTH ========================= */

app.post('/api/register' , async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        // Basic server-side validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const egPhoneRegex = /^(?:\+20|0)?1[0125]\d{8}$/;
        if (!firstName || !lastName) return res.status(400).send('Name required');
        if (!emailRegex.test(email)) return res.status(400).send('Invalid email');
        if (!egPhoneRegex.test(phoneNumber)) return res.status(400).send('Invalid Egyptian phone number');
        if (!password || password.length < 6) return res.status(400).send('Password must be at least 6 characters');

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: hashedPassword
        });

        await newUser.save();

        console.log('User registered successfully');
        res.redirect('/sign_in.html');
    }
    catch (err) {
        console.error('Error registering user', err);
        // Handle duplicate email gracefully
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(400).send('Email already registered');
        }
        res.status(500).send('Server error during registration');
    }
});


app.post('/api/login' , async (req, res) => {
    try {
        const {identifier, password} = req.body; 

        const user = await User.findOne({ email: identifier });

        if(!user) {
            return res.status(400).send('Invalid email or password'); 
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(400).send('Invalid email or password'); 
        }

        req.session.userId = user._id;
        req.session.firstName = user.firstName;
        req.session.lastName = user.lastName;
        req.session.companyName = user.companyName;
        req.session.role = user.role;

        console.log('User logged in successfully');
        res.redirect('/index.html'); 
    }   
    catch (err) {
        console.error('Error logging in user', err);
        res.status(500).send('Server error during login'); 
    }
});


app.get('/api/me', (req, res) => {
    if (req.session.userId) {
        res.json({
            isLoggedIn: true,
            firstName: req.session.firstName,
            lastName: req.session.lastName,
            companyName: req.session.companyName,
            role: req.session.role
        });
    } else {
        res.json({
            isLoggedIn: false,
            role: 'guest'
        });
    }
});


/* ========================= HARDWARE ========================= */

app.get('/api/hardware', async (req, res) => {
    try {
        const cpus = await CPU.find();
        const gpus = await GPU.find();  
        const games = await Game.find();

        res.json({
            cpus: cpus,
            gpus: gpus,
            games: games
        });
    } catch (err) {
        console.error('Error fetching hardware data', err);
        res.status(500).send('Server error fetching hardware data');
    }
});


/* ========================= PRODUCTS ========================= */

app.get('/api/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('baselineHardwareId');
        
        if (!product) {
            return res.status(404).send('Product not found');
        }

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
});


app.get('/api/products/:categoryName', async (req, res) => {
    try{
        const products = await Product.find({ category: req.params.categoryName, approvalStatus: 'approved' })
            .populate('baselineHardwareId');

        res.json(products);

    } catch (err) {
        console.error('Error fetching products', err);
        res.status(500).send('Server error fetching products');
    }
});


app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({ approvalStatus: 'approved' }).limit(8);
        res.json(products);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).send('Server error fetching products');
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send('Failed to load categories');
    }
});


/* ========================= REVIEWS ========================= */

app.post('/api/product/:id/review', async (req, res) => {
    try {
        const { rating, title, comment } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');

        const authorName = req.session.firstName ? `${req.session.firstName} ${req.session.lastName || ''}`.trim() : 'Guest Buyer';

        product.reviews.push({
            rating: Number(rating),
            title,
            comment,
            author: authorName,
            reviewerId: req.session.userId || undefined
        });

        await product.save();
        res.send('Review added successfully!');

    } catch (err) {
        console.error('Error saving review:', err);
        res.status(500).send('Failed to save review');
    }
});

app.get('/api/account/reviews', requireAuth, async (req, res) => {
    try {
        const products = await Product.find({ 'reviews.reviewerId': req.session.userId });
        const reviews = [];

        products.forEach(product => {
            product.reviews.forEach(review => {
                if (review.reviewerId && review.reviewerId.toString() === req.session.userId.toString()) {
                    reviews.push({
                        reviewId: review._id,
                        productId: product._id,
                        productTitle: product.title,
                        rating: review.rating,
                        title: review.title,
                        comment: review.comment,
                        date: review.date
                    });
                }
            });
        });

        res.json(reviews);
    } catch (err) {
        console.error('Error fetching account reviews:', err);
        res.status(500).send('Failed to load reviews');
    }
});

app.delete('/api/account/reviews/:productId/:reviewId', requireAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).send('Product not found');

        const review = product.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).send('Review not found');
        if (!review.reviewerId || review.reviewerId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Unauthorized');
        }

        review.remove();
        await product.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).send('Failed to delete review');
    }
});

app.get('/api/account/wishlist', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('wishlist');
        res.json(user.wishlist || []);
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).send('Failed to load wishlist');
    }
});

app.post('/api/account/wishlist/:productId', requireAuth, async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send('User not found');

        const exists = user.wishlist.some(id => id.toString() === productId);
        if (exists) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            await user.save();
            return res.json({ action: 'removed' });
        }

        user.wishlist.push(productId);
        await user.save();
        res.json({ action: 'added' });
    } catch (err) {
        console.error('Error updating wishlist:', err);
        res.status(500).send('Failed to update wishlist');
    }
});

app.get('/api/account/recently-viewed', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('recentlyViewed');
        res.json(user.recentlyViewed || []);
    } catch (err) {
        console.error('Error fetching recently viewed:', err);
        res.status(500).send('Failed to load recently viewed');
    }
});

app.post('/api/account/recently-viewed/:productId', requireAuth, async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send('User not found');

        user.recentlyViewed = user.recentlyViewed.filter(id => id.toString() !== productId);
        user.recentlyViewed.unshift(productId);
        if (user.recentlyViewed.length > 12) {
            user.recentlyViewed = user.recentlyViewed.slice(0, 12);
        }
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating recently viewed:', err);
        res.status(500).send('Failed to save recently viewed');
    }
});


/* ========================= AUTH CHECK ========================= */

function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).send('Not logged in');
    }
}


/* ========================= CART ========================= */

app.get('/api/cart', requireAuth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.session.userId })
            .populate('items.productId');

        if (!cart) cart = { items: [] };

        res.json(cart);
    } catch (err) {
        res.status(500).send('Cart error');
    }
});


app.post('/api/cart/add', requireAuth, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) cart = new Cart({ userId: req.session.userId, items: [] });

        const existing = cart.items.find(i => i.productId.toString() === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                title: product.title,
                manufacturer: product.manufacturer || '',
                imageUrl: product.imageUrl || '',
                price: product.price,
                category: product.category || '',
                quantity,
                vendorId: product.vendorId
            });
        }

        await cart.save();
        const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);
        res.json({ success: true, itemCount });

    } catch (err) {
        res.status(500).json({ error: 'Add to cart error' });
    }
});


app.get('/api/cart/count', requireAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        const count = cart ? cart.items.reduce((s, i) => s + i.quantity, 0) : 0;
        res.json({ count });
    } catch (err) {
        res.status(500).json({ count: 0 });
    }
});


app.put('/api/cart/item/:productId', requireAuth, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (!quantity || quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const item = cart.items.find(i => i.productId.toString() === req.params.productId);
        if (!item) return res.status(404).json({ error: 'Item not in cart' });

        item.quantity = quantity;
        await cart.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Update error' });
    }
});


app.delete('/api/cart/item/:productId', requireAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
        await cart.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Remove error' });
    }
});


app.delete('/api/cart', requireAuth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId });
        if (cart) { cart.items = []; await cart.save(); }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Clear cart error' });
    }
});


/* ========================= ACCOUNT ========================= */

app.get('/api/account/profile', requireAuth, async (req, res) => {
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
});


app.put('/api/account/profile', requireAuth, async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.session.userId,
        req.body,
        { new: true }
    ).select('-password');

    res.json(user);
});


app.put('/api/account/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.session.userId);

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) return res.status(400).send('Wrong password');

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.send('Password updated');
    } catch (err) {
        res.status(500).send('Password error');
    }
});


/* ========================= ORDERS ========================= */

app.post('/api/cart/checkout', requireAuth, async (req, res) => {
    try {
        const { shippingAddress = '', paymentMethod = 'card', notes = '' } = req.body;

        const cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }

        const total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        const expandedItems = cart.items.map(item => ({
            productId: item.productId,
            title: item.title,
            manufacturer: item.manufacturer,
            imageUrl: item.imageUrl,
            price: item.price,
            quantity: item.quantity,
            category: item.category,
            vendorId: item.vendorId,
            fulfillmentStatus: 'pending'
        }));

        const order = new Order({
            userId: req.session.userId,
            items: expandedItems,
            total,
            shippingAddress,
            paymentMethod,
            notes
        });

        await order.save();
        cart.items = [];
        await cart.save();

        res.json({ success: true, orderId: order._id });

    } catch (err) {
        res.status(500).json({ error: 'Checkout error' });
    }
});


app.get('/api/account/orders', requireAuth, async (req, res) => {
    const orders = await Order.find({ userId: req.session.userId });
    res.json(orders);
});


/* ========================= BENCHMARK ========================= */

app.post('/api/benchmark/save', async (req, res) => {
    try {
        const result = new BenchmarkResult(req.body);
        await result.save();

        res.json({ success: true });
    } catch (err) {
        res.status(500).send('Benchmark error');
    }
});


app.get('/api/benchmark/history', requireAuth, async (req, res) => {
    const results = await BenchmarkResult.find({ userId: req.session.userId });
    res.json(results);
});


/* ========================= LOGOUT ========================= */

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Logout failed');
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});


/* ========================= RBAC HELPERS ========================= */

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

app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'admin.html'));
});

app.get('/vendor', requireAuth, requireVendor, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'vendor.html'));
});

app.get('/superadmin', requireAuth, requireSuperAdmin, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'superadmin.html'));
});


/* ========================= ADMIN - PRODUCTS ========================= */

app.get('/api/admin/products', requireAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

app.post('/api/admin/add-product', requireSuperAdmin, async (req, res) => {
    try {
        const product = new Product({ ...req.body, approvalStatus: 'approved' });
        await product.save();
        res.send('Product saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving product: ' + err.message);
    }
});

app.put('/api/admin/edit-product/:id', requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.send('Product updated!');
    } catch (err) {
        res.status(500).send('Error updating product');
    }
});

app.delete('/api/admin/delete-product/:id', requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.send('Product deleted!');
    } catch (err) {
        res.status(500).send('Error deleting product');
    }
});


/* ========================= ADMIN - HARDWARE ========================= */

app.post('/api/admin/add-cpu', requireAdmin, async (req, res) => {
    try {
        const cpu = new CPU(req.body);
        await cpu.save();
        res.send('CPU saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving CPU: ' + err.message);
    }
});

app.post('/api/admin/add-gpu', requireAdmin, async (req, res) => {
    try {
        const gpu = new GPU(req.body);
        await gpu.save();
        res.send('GPU saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving GPU: ' + err.message);
    }
});

app.post('/api/admin/add-game', requireAdmin, async (req, res) => {
    try {
        const game = new Game(req.body);
        await game.save();
        res.send('Game saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving game: ' + err.message);
    }
});


/* ========================= ADMIN - USERS ========================= */

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const query = req.session.role === 'admin'
            ? { role: { $in: ['customer', 'vendor'] } }
            : {};
        const users = await User.find(query).select('-password').sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Error fetching users');
    }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
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
        res.status(500).send('Error updating user');
    }
});

app.put('/api/admin/users/:id/role', requireSuperAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['customer', 'vendor', 'admin', 'superadmin'].includes(role)) {
            return res.status(400).send('Invalid role');
        }
        await User.findByIdAndUpdate(req.params.id, { role });
        res.send('Role updated!');
    } catch (err) {
        res.status(500).send('Error updating role');
    }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
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
        res.status(500).send('Error deleting user');
    }
});


/* ========================= ADMIN - ORDERS ========================= */

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).send('Error fetching orders');
    }
});

app.get('/api/admin/product-stats', requireAdmin, async (req, res) => {
    try {
        const products = await Product.find();
        const orders = await Order.find();

        let sales = 0, revenue = 0, byProduct = {};
        orders.forEach(o => {
            o.items.forEach(item => {
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
        res.status(500).send('Error fetching product stats');
    }
});

app.get('/api/superadmin/users', requireSuperAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Error fetching users');
    }
});

app.get('/api/superadmin/orders', requireSuperAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).send('Error fetching orders');
    }
});

app.post('/api/superadmin/categories', requireSuperAdmin, async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const category = new Category({ name, slug, description });
        await category.save();
        res.send('Category created!');
    } catch (err) {
        res.status(500).send('Error creating category');
    }
});

app.put('/api/superadmin/categories/:id', requireSuperAdmin, async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.params.id, req.body);
        res.send('Category updated!');
    } catch (err) {
        res.status(500).send('Error updating category');
    }
});

app.delete('/api/superadmin/categories/:id', requireSuperAdmin, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.send('Category deleted!');
    } catch (err) {
        res.status(500).send('Error deleting category');
    }
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.send('Status updated!');
    } catch (err) {
        res.status(500).send('Error updating order status');
    }
});

app.get('/api/admin/products/pending', requireAdmin, async (req, res) => {
    try {
        const products = await Product.find({ approvalStatus: 'pending' }).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching pending products');
    }
});

app.put('/api/admin/products/:id/approve', requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { approvalStatus: 'approved', moderationNotes: '' });
        res.send('Product approved!');
    } catch (err) {
        res.status(500).send('Error approving product');
    }
});

app.put('/api/admin/products/:id/reject', requireAdmin, async (req, res) => {
    try {
        const { notes = '' } = req.body;
        await Product.findByIdAndUpdate(req.params.id, { approvalStatus: 'rejected', moderationNotes: notes });
        res.send('Product rejected!');
    } catch (err) {
        res.status(500).send('Error rejecting product');
    }
});


/* ========================= VENDOR ROUTES ========================= */

app.get('/api/vendor/products', requireVendor, async (req, res) => {
    try {
        const products = await Product.find({ vendorId: req.session.userId }).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

app.post('/api/vendor/add-product', requireVendor, async (req, res) => {
    try {
        const supplierName = req.session.companyName || `${req.session.firstName} ${req.session.lastName}`;
        await new Product({ ...req.body, supplierName, vendorId: req.session.userId, approvalStatus: 'pending' }).save();
        res.send('Product saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving product: ' + err.message);
    }
});

app.put('/api/vendor/orders/:orderId/item/:itemId/status', requireVendor, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).send('Order not found');

        const item = order.items.id(req.params.itemId);
        if (!item) return res.status(404).send('Order item not found');
        if (!item.vendorId || item.vendorId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Cannot modify this item');
        }

        item.fulfillmentStatus = status;
        await order.save();
        res.send('Item fulfillment status updated!');
    } catch (err) {
        res.status(500).send('Error updating item status');
    }
});

app.put('/api/vendor/edit-product/:id', requireVendor, async (req, res) => {
    try {
        const p = await Product.findById(req.params.id);
        if (!p || p.vendorId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Not your product');
        }
        await Product.findByIdAndUpdate(req.params.id, req.body);
        res.send('Product updated!');
    } catch (err) {
        res.status(500).send('Error updating product');
    }
});

app.delete('/api/vendor/delete-product/:id', requireVendor, async (req, res) => {
    try {
        const p = await Product.findById(req.params.id);
        if (!p || p.vendorId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Not your product');
        }
        await Product.findByIdAndDelete(req.params.id);
        res.send('Product deleted!');
    } catch (err) {
        res.status(500).send('Error deleting product');
    }
});

app.get('/api/vendor/sales-stats', requireVendor, async (req, res) => {
    try {
        const products = await Product.find({ vendorId: req.session.userId });
        const ids = products.map(p => p._id);
        const orders = await Order.find({ 'items.productId': { $in: ids } });

        let sales = 0, revenue = 0, byProduct = {};
        orders.forEach(o => {
            o.items.forEach(item => {
                if (ids.includes(item.productId)) {
                    const key = item.title;
                    byProduct[key] = byProduct[key] || { quantity: 0, revenue: 0 };
                    byProduct[key].quantity += item.quantity;
                    byProduct[key].revenue += item.price * item.quantity;
                    sales += item.quantity;
                    revenue += item.price * item.quantity;
                }
            });
        });

        res.json({
            totalSales: sales,
            totalRevenue: revenue,
            salesByProduct: byProduct,
            totalProducts: products.length,
            totalOrders: orders.length
        });
    } catch (err) {
        res.status(500).send('Error fetching stats');
    }
});

app.get('/api/vendor/orders', requireVendor, async (req, res) => {
    try {
        const products = await Product.find({ vendorId: req.session.userId });
        const ids = products.map(p => p._id);
        const orders = await Order.find({ 'items.productId': { $in: ids } }).populate('userId', 'firstName lastName email').sort({ createdAt: -1 });
        
        res.json(orders.map(o => ({
            ...o.toObject(),
            items: o.items.filter(i => ids.includes(i.productId))
        })));
    } catch (err) {
        res.status(500).send('Error fetching orders');
    }
});



/* ========================= START SERVER ========================= */

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});