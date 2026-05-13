const express = require('express'); //Express el framework el bey simplify el server creation w routing w handling requests
const mongoose = require('mongoose'); //mongoose el bouncer el bey enforce el schema w el validation
const bcrypt = require('bcrypt'); //hash passwords for security
const User = require('./models/Users'); //import User model
const session = require('express-session'); //handle user sessions

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
        
// A quick route to check who is currently logged in
app.get('/api/me', (req, res) => {
    // Check if the session has a userId
    if (req.session.userId) {
        res.send(`You are logged in as ${req.session.firstName} with a ${req.session.role} account.`);
    } else {
        res.send('You are not logged in.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});