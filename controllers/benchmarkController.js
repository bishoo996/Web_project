// Benchmark controller handles saving and retrieving benchmark result records.
const BenchmarkResult = require('../models/BenchmarkResult');

async function saveBenchmark(req, res) {
    try {
        const result = new BenchmarkResult(req.body);
        await result.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving benchmark result', err);
        res.status(500).json({ error: 'Benchmark error' });
    }
}

async function getBenchmarkHistory(req, res) {
    try {
        const results = await BenchmarkResult.find({ userId: req.session.userId });
        res.json(results);
    } catch (err) {
        console.error('Error fetching benchmark history', err);
        res.status(500).json({ error: 'Error fetching benchmark history' });
    }
}

module.exports = { saveBenchmark, getBenchmarkHistory };