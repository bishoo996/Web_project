const mongoose = require('mongoose');

// Cart schema stores a single cart per user and contains item metadata for each selected product.
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    title:    { type: String, required: true },
    manufacturer: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    category: { type: String, default: '' },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true          // one cart document per user
    },
    items: [cartItemSchema]
}, { timestamps: true });

// Virtual: computed total
cartSchema.virtual('total').get(function () {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
