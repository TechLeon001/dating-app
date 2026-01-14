const User = require('../models/User');
const Swipe = require('../models/Swipe');

// Helper function to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// @desc    Get potential matches
// @route   GET /api/discovery/potential
// @access  Private
exports.getPotentialMatches = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get swiped users
    const swipes = await Swipe.find({ swiper: userId });
    const swipedUserIds = swipes.map(swipe => swipe.swipee);
    
    // Build query
    let query = {
      _id: { 
        $ne: userId, 
        $nin: swipedUserIds 
      },
      'profile.age': { 
        $gte: user.preferences.minAge, 
        $lte: user.preferences.maxAge 
      },
      'profile.gender': { $in: user.preferences.genderPreference },
      isActive: true
    };
    
    // If user has location, filter by distance
    if (user.profile.location && user.profile.location.coordinates[0] !== 0) {
      const [lon, lat] = user.profile.location.coordinates;
      const maxDistance = user.preferences.maxDistance * 1000; // Convert to meters
      
      query['profile.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: maxDistance
        }
      };
    }
    
    // Get potential matches
    const potentialMatches = await User.find(query)
      .select('profile.name profile.age profile.gender profile.photos profile.bio profile.interests profile.location')
      .limit(20);
    
    // Calculate distance for each match
    const matchesWithDistance = potentialMatches.map(match => {
      const matchData = match.toObject();
      
      if (user.profile.location && match.profile.location) {
        const [userLon, userLat] = user.profile.location.coordinates;
        const [matchLon, matchLat] = match.profile.location.coordinates;
        
        if (userLat && userLon && matchLat && matchLon) {
          matchData.distance = calculateDistance(
            userLat, userLon,
            matchLat, matchLon
          ).toFixed(1);
        }
      }
      
      return matchData;
    });
    
    res.status(200).json({
      success: true,
      count: matchesWithDistance.length,
      data: matchesWithDistance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Record a swipe
// @route   POST /api/discovery/swipe
// @access  Private
exports.recordSwipe = async (req, res, next) => {
  try {
    const { swipeeId, direction } = req.body; // direction: 'like', 'dislike', 'superlike'
    const swiperId = req.user._id;
    
    // Check if already swiped
    const existingSwipe = await Swipe.findOne({
      swiper: swiperId,
      swipee: swipeeId
    });
    
    if (existingSwipe) {
      return res.status(400).json({
        success: false,
        message: 'Already swiped on this user'
      });
    }
    
    // Record swipe
    const swipe = await Swipe.create({
      swiper: swiperId,
      swipee: swipeeId,
      direction,
      timestamp: Date.now()
    });
    
    // Check for match (if direction is like or superlike)
    if (direction === 'like' || direction === 'superlike') {
      const reciprocalSwipe = await Swipe.findOne({
        swiper: swipeeId,
        swipee: swiperId,
        direction: { $in: ['like', 'superlike'] }
      });
      
      if (reciprocalSwipe) {
        // It's a match!
        const Match = require('../models/Match');
        const match = await Match.create({
          users: [swiperId, swipeeId],
          createdAt: Date.now()
        });
        
        // Emit match notification via socket.io
        const io = req.app.get('io');
        const swiperSocketId = req.app.get('connectedUsers').get(swiperId);
        const swipeeSocketId = req.app.get('connectedUsers').get(swipeeId);
        
        if (swiperSocketId) {
          io.to(swiperSocketId).emit('new_match', {
            matchId: match._id,
            user: await User.findById(swipeeId).select('profile.name profile.photos')
          });
        }
        
        if (swipeeSocketId) {
          io.to(swipeeSocketId).emit('new_match', {
            matchId: match._id,
            user: await User.findById(swiperId).select('profile.name profile.photos')
          });
        }
        
        return res.status(201).json({
          success: true,
          data: {
            swipe,
            match,
            isMatch: true
          }
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        swipe,
        isMatch: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};