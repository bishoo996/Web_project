const mongoose = require('mongoose');

const cpuSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },

    brand: { type: String, enum: ['Intel', 'AMD'], required: true },

    socket: { type: String, required: true },

    price: { type: Number, required: true },

    computeScore: { type: Number, required: true }
}, {timestamps: true});

module.exports = mongoose.model('CPU', cpuSchema);