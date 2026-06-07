const bcrypt = require('bcrypt');
const User = require('../models/Users');

async function register(req, res) {
    try {
        const { firstName, lastName, email, phoneNumber, password } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const egPhoneRegex = /^(?:\+20|0)?1[0125]\d{8}$/;
        if (!firstName || !lastName) return res.status(400).send('Name required');
        if (!emailRegex.test(email)) return res.status(400).send('Invalid email');
        if (!egPhoneRegex.test(phoneNumber)) return res.status(400).send('Invalid Egyptian phone number');
        if (!password || password.length < 6) return res.status(400).send('Password must be at least 6 characters');

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, email, phoneNumber, password: hashedPassword });

        await newUser.save();
        res.redirect('/sign_in.html');
    } catch (err) {
        console.error('Error registering user', err);
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(400).send('Email already registered');
        }
        res.status(500).send('Server error during registration');
    }
}

async function login(req, res) {
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({ email: identifier });
        if (!user) return res.status(400).send('Invalid email or password');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Invalid email or password');

        req.session.userId = user._id;
        req.session.firstName = user.firstName;
        req.session.lastName = user.lastName;
        req.session.companyName = user.companyName;
        req.session.role = user.role;

        res.redirect('/index.html');
    } catch (err) {
        console.error('Error logging in user', err);
        res.status(500).send('Server error during login');
    }
}

function me(req, res) {
    if (req.session.userId) {
        res.json({
            isLoggedIn: true,
            firstName: req.session.firstName,
            lastName: req.session.lastName,
            companyName: req.session.companyName,
            role: req.session.role
        });
    } else {
        res.json({ isLoggedIn: false, role: 'guest' });
    }
}

function logout(req, res) {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Logout failed');
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
}

module.exports = { register, login, me, logout };