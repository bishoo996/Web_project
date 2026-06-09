// Bn-import el Models (el haikal bta3 el data) mn el database bta3et MongoDB.
// Kol wa7ed mn dol by-mathel table (collection) gowa el DB.
const CPU = require('../models/CPU');
const GPU = require('../models/GPU');
const Game = require('../models/Game');
const Category = require('../models/Category');

// 1. Function getHardware: El function dy b-tegy lma el frontend ya5od el data bta3t el PC parts w el games.
async function getHardware(req, res) {
    try {
        // Bn-kalem el database w n-qolha hatly KOL el CPUs, GPUs, w Games el mawgodeen.
        // El 'await' hna 3ashan el server ystna el database t-rod 3aleh abl ma ykamel.
        const cpus = await CPU.find();
        const gpus = await GPU.find();
        const games = await Game.find();
        
        // Lma el data kolha tegy, bn-gma3ha f object wa7ed w n-eb3at-ha lel frontend 3ala shkl JSON.
        res.json({ cpus, gpus, games });
    } catch (err) {
        // Lw 7asal ay moshkela (DB wa23a, connection error, etc...)
        // Bn-tba3 el error f console el server 3ashan el developer yshoofo.
        console.error('Error fetching hardware data', err);
        // W n-eb3at lel user status 500 (Internal Server Error) w رسالة tfahmo en feh moshkela.
        res.status(500).json({ error: 'Server error fetching hardware data' });
    }
}

// 2. Function getCategories: El function dy b-trg3 el aqsam (Categories) bta3t el store.
async function getCategories(req, res) {
    try {
        // Hna el query adka shwaya!
        // Bn-hat el categories el { isActive: true } bas (ya3ny el aqsam el sha8ala w msh ma5feya).
        // W .sort({ name: 1 }) by-rattebhom abgady (A to Z) 3ashan shaklhom yb2a ndef fel frontend.
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        
        // Bn-eb3at list el categories dy JSON lel frontend.
        res.json(categories);
    } catch (err) {
        // Nfs el fkra, lw 7asal error bn-log el error w n-rod b status 500.
        console.error('Error fetching categories', err);
        res.status(500).json({ error: 'Failed to load categories' });
    }
}

// Bn-export el 2 functions dol 3ashan el "Router" file ya3raf yeshofhom w y-orbot-hom b-URL mo3ayan.
// Mathalan: app.get('/api/hardware', getHardware);
module.exports = { getHardware, getCategories };