require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const apiRoutes = require('./routes/api');
const viewRoutes = require('./routes/views');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
 secret: process.env.SESSION_SECRET || 'fallback_dev_secret',
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

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web_projectDB')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB', err));

app.use('/api', apiRoutes);
app.use('/', viewRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
     console.log(`Server is running on http://localhost:${PORT}`);
});