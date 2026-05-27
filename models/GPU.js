const mongoose = require('mongoose');

const gpuSchema = new mongoose.Schema({
    
    name: { type: String, required: true, unique: true },

    brand: { type: String, enum: ['Intel', 'AMD', 'NVIDIA'], required: true },

    vram: { type: Number, required: true },

    price: { type: Number, required: true },

    renderScores: { 
        p1080: { type: Number, required: true },
        p1440: { type: Number, required: true },
        p4k: { type: Number, required: true }
     }

}, {timestamp: true});

module.exports = mongoose.model('GPU', gpuSchema);