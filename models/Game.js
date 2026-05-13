const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },   
    optimizationFactor: { type: Number, required: true },
    cpuIntensive: { type: Boolean, required: true },
    
}, {timestamps: true});

module.exports = mongoose.model('Game', gameSchema);