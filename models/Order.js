const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title:        { type: String, required: true },
    manufacturer: { type: String, default: '' },
    imageUrl:     { type: String, default: '' },
    price:        { type: Number, required: true },
    quantity:     { type: Number, required: true, min: 1 },
    category:     { type: String, default: '' },
    vendorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    fulfillmentStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items:       [orderItemSchema],
    total:       { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: { type: String, default: '' },
    paymentMethod:   { type: String, default: 'card' },
    notes:           { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
