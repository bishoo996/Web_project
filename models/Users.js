const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'customer' , 'vendor'],
        default: 'customer'
    },

    companyName: {type: String}, //for vendors only

    phoneNumber: {type: String},

    address: {type: String}


}, { timestamps: true }); //bet add createdAt w updatedAt automatically

module.exports = mongoose.model('User' , userSchema);