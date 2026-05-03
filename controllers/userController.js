import express from 'express';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs/dist/bcrypt.js';

let saltRounds = 8;
const me = async (req, res) => {
    if (req.body == null) {
        return res.status(400).send("Enter your information")
    }
    const user = await User.findById(req.user.id);
    return res.status(200).send({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
    });


}



const sign_in = async (req, res) => {
    if (req.body == null) {
        return res.status(400).send("Enter your information")

    }
    const email = req.body.email;
    if (email == null) {
        return res.status(400).send("Enter your email")
    }

    const user = await User.findOne({ email: email });
    if (user == null) {
        return res.status(400).send("Please sign up with this mail")
    }
    const password = req.body.password;
    if (password == null) {
        return res.status(400).send("Enter your password")
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(400).send("Enter a valid password")
    }
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.SECRET_KEY
    );

    res.status(200).send(token)

}

const sign_up = async (req, res) => {
    if (req.body == null) {
        return res.status(400).send("Enter your information")
    }
    const firstname = req.body.firstname;

    if (firstname == null) {
        return res.status(400).send("Enter your Firstname");
    }
    const lastname = req.body.lastname;
    if (lastname == null) {
        return res.status(400).send("Enter your Lastname");
    }

    const email = req.body.email;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).send("Invalid email format");
    }
    const user = await User.findOne({ email: email });

    console.log(user);
    if (user != null) {
        return res.status(409).send("This email used before, Try another email")
    }

    const phone = req.body.phone;
    if (phone != null && phone[0] !== 0 && phone[1] !== 1 && phone.length !== 11) {
        return res.status(400).send("Wrong Phone");
    }
    const password = req.body.password;
    if (password != null && password.length < 8) {
        return res.status(400).send("Min Password length 8");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);



    const newuser = new User({
        firstname: firstname,
        lastname: lastname,
        email: email,
        phone: phone,
        password: hashedPassword
    })
    const savedUser = await newuser.save();

    const token = jwt.sign(
        { id: savedUser._id, email: savedUser.email },
        process.env.SECRET_KEY
    );

    res.status(200).send(token)

}
export default { sign_up, sign_in,me};
