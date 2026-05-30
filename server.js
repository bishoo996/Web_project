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
        
        res.json(product);
    } catch (err) {
        console.error('Error fetching single product:', err);
        res.status(500).send('Server error fetching product details');
    }
});


app.get('/api/products/:categoryName', async (req, res) => {
    try{
        const products = await Product.find({ category: req.params.categoryName })
            .populate('baselineHardwareId');

        res.json(products);

    } catch (err) {
        console.error('Error fetching products', err);
        res.status(500).send('Server error fetching products');
    }
});


app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().limit(8);
        res.json(products);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).send('Server error fetching products');
    }
});


/* ========================= REVIEWS ========================= */

app.post('/api/product/:id/review', async (req, res) => {
    try {
        const { rating, title, comment } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');

        const authorName = req.session.firstName ? req.session.firstName : 'Guest Buyer';

        product.reviews.push({
            rating: Number(rating),
            title,
            comment,
            author: authorName
        });

        await product.save();
        res.send('Review added successfully!');

    } catch (err) {
        console.error('Error saving review:', err);
        res.status(500).send('Failed to save review');
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
                quantity
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

        const order = new Order({
            userId: req.session.userId,
            items: cart.items,
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


/* ========================= ADMIN MIDDLEWARE ========================= */

function requireAdmin(req, res, next) {
    if (req.session.userId && (req.session.role === 'admin' || req.session.role === 'superadmin')) {
        next();
    } else {
        res.status(403).send('Admin access required');
    }
}

function requireSuperAdmin(req, res, next) {
    if (req.session.userId && req.session.role === 'superadmin') {
        next();
    } else {
        res.status(403).send('Super Admin access required');
    }
}

function requireVendor(req, res, next) {
    if (req.session.userId && req.session.role === 'vendor') {
        next();
    } else {
        res.status(403).send('Vendor access required');
    }
}


/* ========================= ADMIN - PRODUCTS ========================= */

app.get('/api/admin/products', requireAdmin, async (req, res) => {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Error fetching products');
    }
});

app.post('/api/admin/add-product', requireAdmin, async (req, res) => {
    try {
        const product = new Product(req.body);
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
        const users = await User.find().select('-password').sort({ _id: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Error fetching users');
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

app.delete('/api/admin/users/:id', requireSuperAdmin, async (req, res) => {
    try {
        if (req.params.id === req.session.userId.toString()) {
            return res.status(400).send('Cannot delete your own account');
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

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.send('Status updated!');
    } catch (err) {
        res.status(500).send('Error updating order status');
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
        await new Product({ ...req.body, vendorId: req.session.userId }).save();
        res.send('Product saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving product: ' + err.message);
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

app.post('/api/vendor/add-cpu', requireVendor, async (req, res) => {
    try {
        await new CPU(req.body).save();
        res.send('CPU saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving CPU: ' + err.message);
    }
});

app.post('/api/vendor/add-gpu', requireVendor, async (req, res) => {
    try {
        await new GPU(req.body).save();
        res.send('GPU saved successfully!');
    } catch (err) {
        res.status(500).send('Error saving GPU: ' + err.message);
    }
});


/* ========================= START SERVER ========================= */

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});