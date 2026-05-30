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
        if (!product) return res.status(404).send('Product not found');

        let cart = await Cart.findOne({ userId: req.session.userId });

        if (!cart) {
            cart = new Cart({ userId: req.session.userId, items: [] });
        }

        const existing = cart.items.find(i =>
            i.productId.toString() === productId
        );

        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                title: product.title,
                price: product.price,
                quantity
            });
        }

        await cart.save();
        res.json({ success: true });

    } catch (err) {
        res.status(500).send('Add to cart error');
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
        const cart = await Cart.findOne({ userId: req.session.userId });

        const total = cart.items.reduce(
            (sum, i) => sum + i.price * i.quantity, 0
        );

        const order = new Order({
            userId: req.session.userId,
            items: cart.items,
            total
        });

        await order.save();
        cart.items = [];
        await cart.save();

        res.json({ success: true });

    } catch (err) {
        res.status(500).send('Checkout error');
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


/* ========================= START SERVER ========================= */

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});