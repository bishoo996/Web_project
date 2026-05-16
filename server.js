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


const app = express();
const PORT = 3000;

app.use(session({
    secret: 'your_secret_key', //secret key for signing session ID cookies
    resave: false, //don't save session if unmodified
    saveUninitialized: false, //don't create session until something stored
    cookie: { secure: false, 
        maxAge: 1000 * 60 * 60 * 24 
    } 
}));    

app.use(express.static('public'));  //serve static files awel ma el web yetlobo mel server

app.use(express.json()); //parse JSON bodies

app.use(express.urlencoded({ extended: true })); //parse URL-encoded bodies el gaya mel <form>

mongoose.connect('mongodb://localhost:27017/web_projectDB')
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Could not connect to MongoDB', err));  


app.post('/api/register' , async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10); //hash password with salt rounds of 10 (complexity)
        
        const newUser = new User({
            firstName : firstName,
            lastName : lastName,
            email: email,
            phoneNumber: phoneNumber,
            password: hashedPassword
        });

        await newUser.save(); //save user to database

        console.log('User registered successfully');
        res.redirect('/sign_in.html'); //redirect to sign in page after successful registration
    }
    catch (err) {
        console.error('Error registering user', err); 
    }

})

app.post('/api/login' , async (req, res) => {
    try {
        const {identifier, password} = req.body; 

        const user = await User.findOne({ email: identifier }); //find user by email

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
        

// A route to check who is currently logged in
app.get('/api/me', (req, res) => {
    // Check if the session has a userId
    if (req.session.userId) {   //sends json response with user data
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


app.get('/api/hardware', async (req, res) => {
    try {
        const cpus = await CPU.find(); //find() = get every doc in collection
        const gpus = await GPU.find();  
        const games = await Game.find();

        res.json({   //package all into json response to frontend
            cpus: cpus,
            gpus: gpus,
            games: games
        });
    } catch (err) {
        console.error('Error fetching hardware data', err);
        res.status(500).send('Server error fetching hardware data');
    }
    });

app.get('/api/product/:id', async (req, res) => {  //fetch single product by id, :id is a url parameter that can be accessed with req.params.id
    try {
        // Find the specific product and populate the benchmark magic link if it exists
        const product = await Product.findById(req.params.id).populate('baselineHardwareId');
        
        if (!product) {
            return res.status(404).send('Product not found');
        }
        
        res.json(product);
    } catch (err) {
        console.error('Error fetching single product:', err);
        res.status(500).send('Server error fetching product details');
    }
});

// ==========================================
// SUBMIT REVIEW ROUTE (PUBLIC / LOGGED IN)
// ==========================================
app.post('/api/product/:id/review', async (req, res) => {
    try {
        const { rating, title, comment } = req.body;
        
        // 1. Find the specific product
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');

        // 2. See if the user is logged in. If not, call them "Guest"
        const authorName = req.session.firstName ? req.session.firstName : 'Guest Buyer';

        // 3. Push the new review into the product's array
        product.reviews.push({
            rating: Number(rating),
            title: title,
            comment: comment,
            author: authorName
        });

        // 4. Save the product back to the database
        await product.save();
        res.send('Review added successfully!');

    } catch (err) {
        console.error('Error saving review:', err);
        res.status(500).send('Failed to save review');
    }
});

app.get('/api/products/:categoryName', async (req, res) => {      //fetch products by category, :categoryName is a url parameter that can be accessed with req.params.categoryName
    try{
        const requestedCategory = req.params.categoryName; //get category name from url parameter

        const products = await Product.find({ category: requestedCategory }).populate('baselineHardwareId'); //find products with matching category
        res.json(products);

    } catch (err) {
        console.error('Error fetching products', err);
        res.status(500).send('Server error fetching products');
    }
});

app.get('/api/products', async (req, res) => { //fetch all products for homepage grid
    try {
        // Find all products, limit to 8 for the homepage grid
        const products = await Product.find().limit(8);
        res.json(products);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).send('Server error fetching products');
    }
});


function requireAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        next(); 
    } else {
        res.status(403).send('Access denied. Admins only.'); 
    }
}


//cpu route
app.post('/api/admin/add-cpu', requireAdmin, async (req, res) => {
    try {
        const { name, brand, socket, price, computeScore } = req.body;

        const newCPU = new CPU({
            name: name,
            brand: brand,
            socket: socket,
            price: price,
            computeScore: computeScore
        });

        await newCPU.save();
        console.log('Admin added CPU: ', name);
        res.send('CPU added successfully');

    } catch (err) {
        console.error('Error adding CPU', err);
        res.status(500).send('Server error during CPU addition');
    }
});

app.post('/api/admin/add-gpu', requireAdmin, async (req, res) => {
    try {
        const { name, brand, vram, price, renderScores } = req.body;

        const newGPU = new GPU({
            name: name,
            brand: brand,
            vram: vram,
            price: price,
            renderScores: renderScores
        });

        await newGPU.save();
        console.log('Admin added GPU: ', name);
        res.send('GPU added successfully');

    } catch (err) {
        console.error('Error adding GPU', err);
        res.status(500).send('Server error during GPU addition');
    }
});


app.post('/api/admin/add-game', requireAdmin, async (req, res) => { 
    try {
        const { title, optimizationFactor, cpuIntensive, imageUrl } = req.body;
        
        const newGame = new Game({
            title: title,
            optimizationFactor: optimizationFactor,
            cpuIntensive: cpuIntensive,
            imageUrl: imageUrl
        });

        await newGame.save();

        console.log('Admin added Game: ', title);
        res.send('Game added successfully');
    } catch (err) {
        console.error('Error adding Game', err);
        res.status(500).send('Server error during Game addition');
    }
});

app.post('/api/admin/add-product', requireAdmin, async (req, res) => {
    try {
        const { title, manufacturer, category, price, stockStatus, imageUrl, specs, badges, baselineHardwareId, hardwareModel } = req.body;

        const newProduct = new Product({
            title: title,
            manufacturer: manufacturer,
            category: category,
            price: price,
            stockStatus: stockStatus,
            imageUrl: imageUrl,
            specs: specs,
            badges: badges,

            baselineHardwareId: baselineHardwareId || undefined,
            hardwareModel: hardwareModel || undefined
        });

        await newProduct.save();
        console.log(`Admin added ${category}: ${title}`);
        res.send('Product added successfully');

    } catch (err) {
        console.error('Error adding Product', err);
        res.status(500).send('Server error during Product addition');
    }
});

app.get('/api/admin/products', requireAdmin, async (req, res) => {
    try {
        // Sorts by category alphabetically to keep the table organized
        const products = await Product.find().sort({ category: 1 });
        res.json(products);
    } catch (err) {
        console.error('Error fetching inventory:', err);
        res.status(500).send('Failed to load inventory');
    }
});

app.delete('/api/admin/delete-product/:id', requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.send('Product deleted successfully');
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).send('Failed to delete product');
    }
});


app.delete('/api/admin/delete-cpu/:id', requireAdmin, async (req, res) => {
    try {
        await CPU.findByIdAndDelete(req.params.id);
        res.send('CPU deleted successfully');
    } catch (err) {
        console.error('Error deleting CPU', err);
        res.status(500).send('Server error during CPU deletion');
    }
});

app.delete('/api/admin/delete-gpu/:id', requireAdmin, async (req, res) => {
    try {
        await GPU.findByIdAndDelete(req.params.id);
        res.send('GPU deleted successfully');
    } catch (err) {
        console.error('Error deleting GPU', err);
        res.status(500).send('Server error during GPU deletion');
    }
});

app.delete('/api/admin/delete-game/:id', requireAdmin, async (req, res) => {
    try {
        await Game.findByIdAndDelete(req.params.id);
        res.send('Game deleted successfully');
    } catch (err) {
        console.error('Error deleting Game', err);
        res.status(500).send('Server error during Game deletion');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});