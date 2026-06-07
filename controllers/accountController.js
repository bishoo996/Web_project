const User = require('../models/Users');
const Product = require('../models/Product');

async function postReview(req, res) {
    try {
        const { rating, title, comment } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Product not found');

        const authorName = req.session.firstName ? `${req.session.firstName} ${req.session.lastName || ''}`.trim() : 'Guest Buyer';
        product.reviews.push({
            rating: Number(rating),
            title,
            comment,
            author: authorName,
            reviewerId: req.session.userId || undefined
        });

        await product.save();
        res.send('Review added successfully!');
    } catch (err) {
        console.error('Error saving review:', err);
        res.status(500).send('Failed to save review');
    }
}

async function getAccountReviews(req, res) {
    try {
        const products = await Product.find({ 'reviews.reviewerId': req.session.userId });
        const reviews = [];

        products.forEach(product => {
            product.reviews.forEach(review => {
                if (review.reviewerId && review.reviewerId.toString() === req.session.userId.toString()) {
                    reviews.push({
                        reviewId: review._id,
                        productId: product._id,
                        productTitle: product.title,
                        rating: review.rating,
                        title: review.title,
                        comment: review.comment,
                        date: review.date
                    });
                }
            });
        });

        res.json(reviews);
    } catch (err) {
        console.error('Error fetching account reviews:', err);
        res.status(500).send('Failed to load reviews');
    }
}

async function deleteReview(req, res) {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).send('Product not found');

        const review = product.reviews.id(req.params.reviewId);
        if (!review) return res.status(404).send('Review not found');
        if (!review.reviewerId || review.reviewerId.toString() !== req.session.userId.toString()) {
            return res.status(403).send('Unauthorized');
        }

        product.reviews.pull(review._id);
        await product.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).send('Failed to delete review');
    }
}

async function getWishlist(req, res) {
    try {
        const user = await User.findById(req.session.userId).populate('wishlist');
        res.json(user.wishlist || []);
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).send('Failed to load wishlist');
    }
}

async function toggleWishlist(req, res) {
    try {
        const productId = req.params.productId;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send('User not found');

        const exists = user.wishlist.some(id => id.toString() === productId);
        if (exists) {
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            await user.save();
            return res.json({ action: 'removed' });
        }

        user.wishlist.push(productId);
        await user.save();
        res.json({ action: 'added' });
    } catch (err) {
        console.error('Error updating wishlist:', err);
        res.status(500).send('Failed to update wishlist');
    }
}

async function getRecentlyViewed(req, res) {
    try {
        const user = await User.findById(req.session.userId).populate('recentlyViewed');
        res.json(user.recentlyViewed || []);
    } catch (err) {
        console.error('Error fetching recently viewed:', err);
        res.status(500).send('Failed to load recently viewed');
    }
}

async function saveRecentlyViewed(req, res) {
    try {
        const productId = req.params.productId;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).send('User not found');

        user.recentlyViewed = user.recentlyViewed.filter(id => id.toString() !== productId);
        user.recentlyViewed.unshift(productId);
        if (user.recentlyViewed.length > 12) {
            user.recentlyViewed = user.recentlyViewed.slice(0, 12);
        }
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating recently viewed:', err);
        res.status(500).send('Failed to save recently viewed');
    }
}

async function getProfile(req, res) {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Error fetching profile', err);
        res.status(500).send('Error fetching profile');
    }
}

async function updateProfile(req, res) {
    try {
        const user = await User.findByIdAndUpdate(req.session.userId, req.body, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        console.error('Error updating profile', err);
        res.status(500).send('Error updating profile');
    }
}

async function updatePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);
        const match = await require('bcrypt').compare(currentPassword, user.password);
        if (!match) return res.status(400).send('Wrong password');

        user.password = await require('bcrypt').hash(newPassword, 10);
        await user.save();
        res.send('Password updated');
    } catch (err) {
        console.error('Error updating password', err);
        res.status(500).send('Password error');
    }
}

module.exports = {
    postReview,
    getAccountReviews,
    deleteReview,
    getWishlist,
    toggleWishlist,
    getRecentlyViewed,
    saveRecentlyViewed,
    getProfile,
    updateProfile,
    updatePassword
};