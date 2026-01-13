const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    photos: [String], // Array of image URLs (Cloudinary)
    interests: [String],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },
  },
  preferences: {
    minAge: {
      type: Number,
      default: 18,
    },
    maxAge: {
      type: Number,
      default: 100,
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'both'],
      default: 'both',
    },
    maxDistance: {
      type: Number, // in kilometers
      default: 50,
    },
  },
  subscription: {
    type: String,
    enum: ['free', 'premium', 'gold'],
    default: 'free',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for geospatial queries
userSchema.index({ 'profile.location': '2dsphere' });

const User = mongoose.model('User', userSchema);

module.exports = User;