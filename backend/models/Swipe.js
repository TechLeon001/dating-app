const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  swiper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  swipee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['like', 'dislike', 'superlike'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate swipes
swipeSchema.index({ swiper: 1, swipee: 1 }, { unique: true });

// Index for faster queries by direction
swipeSchema.index({ direction: 1, timestamp: -1 });

const Swipe = mongoose.model('Swipe', swipeSchema);

module.exports = Swipe;