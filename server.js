const express = require('express'); //Express el framework el bey simplify el server creation w routing w handling requests
const mongoose = require('mongoose'); //mongoose el bouncer el bey enforce el schema w el validation
const bcrypt = require('bcrypt'); //hash passwords for security
const User = require('./models/Users'); //import User model

const app = express();
const PORT = 3000;

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



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});