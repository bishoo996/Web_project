const mongoose = require('mongoose');
const { collection } = require('./CPU');

const productSchema = new mongoose.Schema({


    title: { type: String, required: true },  //7agat sapta no matter el category
    manufacturer: { type: String, required: true },
    category: { type: String, required: true,
        enum: ['cpu', 'gpu', 'motherboard','memory', 'storage', 'psu','case','cooler','monitor','keyboard','mouse','headset'],
        message: '{Value} is not a valid category'
     },
    price: { type: Number, required: true },
    stockStatus: { type: String, default: 'in', enum: ['in', 'out', 'low'] },
    imageUrl: { type: String },

    specs: [{      //flexibles ll specifics zay DPI refresh rate etc
        k: { type: String},
        v: { type: String}
    }],

    badges: [{
        text: { type: String },
        color: { type: String }
    }],

    baselineHardwareId: {   //34an y link CPU/GPU performance bel product
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'hardwareModel'
    },

    hardwareModel: {
        type: String,
        required: false,
        enum: ['CPU', 'GPU']  //34an y link CPU/GPU performance bel product
    }
});

module.exports = mongoose.model('Product', productSchema);