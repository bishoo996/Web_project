const mongoose = require('mongoose');

// Stores benchmark results for a user, including selected CPU/GPU and measured FPS.
const benchmarkResultSchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cpuId:      { type: mongoose.Schema.Types.ObjectId, ref: 'CPU',  required: true },
    gpuId:      { type: mongoose.Schema.Types.ObjectId, ref: 'GPU',  required: true },
    gameId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    resolution: { type: String, enum: ['1080p', '1440p', '4k'], default: '1440p' },
    fps:        { type: Number, required: true },
    scores: {
        performance: { type: Number, min: 0, max: 100 },
        memory:      { type: Number, min: 0, max: 100 },
        power:       { type: Number, min: 0, max: 100 },
        thermal:     { type: Number, min: 0, max: 100 }
    }
}, { timestamps: true });

module.exports = mongoose.model('BenchmarkResult', benchmarkResultSchema);
