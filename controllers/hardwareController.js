const CPU = require('../models/CPU');
const GPU = require('../models/GPU');
const Game = require('../models/Game');
const Category = require('../models/Category');

async function getHardware(req, res) {
    try {
        const cpus = await CPU.find();
        const gpus = await GPU.find();
        const games = await Game.find();
        res.json({ cpus, gpus, games });
    } catch (err) {
        console.error('Error fetching hardware data', err);
        res.status(500).json({ error: 'Server error fetching hardware data' });
    }
}

async function getCategories(req, res) {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories', err);
        res.status(500).json({ error: 'Failed to load categories' });
    }
}

module.exports = { getHardware, getCategories };