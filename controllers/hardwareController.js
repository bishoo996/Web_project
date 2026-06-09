// Bn-import el Models (el haikal bta3 el data) mn el database bta3et MongoDB.
const CPU = require('../models/CPU');
const GPU = require('../models/GPU');
const Game = require('../models/Game');
const Category = require('../models/Category');


async function getHardware(req, res) {
    try {
        
        // El 'await' hna 3ashan el server ystna el database t-rod 3aleh abl ma ykamel.
        const cpus = await CPU.find();
        const gpus = await GPU.find();
        const games = await Game.find();
        
        res.json({ cpus, gpus, games });
    } catch (err) {
        console.error('Error fetching hardware data', err);
        res.status(500).json({ error: 'Server error fetching hardware data' });
    }
}

// 2. Function getCategories: El function dy betrg3 el Categories bta3t el store.
async function getCategories(req, res) {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories', err);
        res.status(500).json({ error: 'Failed to load categories' });
    }
}

// Bn-export el 2 functions dol 3ashan el "Router" file ya3raf yeshofhom w yorbothom be URL mo3ayan.
// ex: app.get('/api/hardware', getHardware);
module.exports = { getHardware, getCategories };