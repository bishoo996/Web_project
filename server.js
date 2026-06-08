require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

const app = express();
const PORT = process.env.PORT ||3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
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

app.use('/api', apiRoutes);
app.use('/', viewRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// FIX 2: Connect to the database first, THEN start listening for traffic
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start the server only after a successful DB connection
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Could not connect to MongoDB. Server not started.', err);
    });




