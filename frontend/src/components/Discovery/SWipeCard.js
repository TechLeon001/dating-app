const React = require('react');
const { useState } = require('react');
const PropTypes = require('prop-types');
const TinderCard = require('react-tinder-card').default;
const { FaHeart, FaTimes, FaStar, FaLocationArrow } = require('react-icons/fa');

const SwipeCard = ({ user, onSwipe }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const swipe = (direction) => {
    if (direction === 'right') {
      onSwipe('like');
    } else if (direction === 'left') {
      onSwipe('dislike');
    } else if (direction === 'up') {
      onSwipe('superlike');
    }
  };
  
  const nextPhoto = () => {
    if (user.profile.photos && currentPhotoIndex < user.profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };
  
  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };
  
  const calculateAge = (birthdate) => {
    // Implementation
    return user.profile.age;
  };
  
  return (
    <div className="swipe-container">
      <TinderCard
        className="swipe-card"
        onSwipe={swipe}
        preventSwipe={['down']}
      >
        <div className="card">
          {/* Photos */}
          <div className="card-images">
            {user.profile.photos && user.profile.photos.length > 0 ? (
              <>
                <img 
                  src={user.profile.photos[currentPhotoIndex].url} 
                  alt={`${user.profile.name}`}
                  className="card-image"
                />
                <div className="photo-counter">
                  {currentPhotoIndex + 1} / {user.profile.photos.length}
                </div>
                {currentPhotoIndex > 0 && (
                  <button className="nav-button prev" onClick={prevPhoto}>
                    ←
                  </button>
                )}
                {currentPhotoIndex < user.profile.photos.length - 1 && (
                  <button className="nav-button next" onClick={nextPhoto}>
                    →
                  </button>
                )}
              </>
            ) : (
              <div className="no-photo">No photos available</div>
            )}
          </div>
          
          {/* User Info */}
          <div className="card-info">
            <h2 className="user-name">
              {user.profile.name}, {calculateAge(user.profile.birthdate)}
              {user.distance && (
                <span className="distance">
                  <FaLocationArrow /> {user.distance} km away
                </span>
              )}
            </h2>
            
            {user.profile.bio && (
              <p className="user-bio">{user.profile.bio}</p>
            )}
            
            {user.profile.interests && user.profile.interests.length > 0 && (
              <div className="interests">
                {user.profile.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            )}
            
            {/* Additional Info */}
            <div className="additional-info">
              {user.profile.occupation && (
                <div className="info-item">
                  <span className="label">Occupation:</span>
                  <span>{user.profile.occupation}</span>
                </div>
              )}
              {user.profile.education && (
                <div className="info-item">
                  <span className="label">Education:</span>
                  <span>{user.profile.education}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </TinderCard>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn-dislike"
          onClick={() => swipe('left')}
        >
          <FaTimes /> Dislike
        </button>
        
        <button 
          className="btn-superlike"
          onClick={() => swipe('up')}
        >
          <FaStar /> Super Like
        </button>
        
        <button 
          className="btn-like"
          onClick={() => swipe('right')}
        >
          <FaHeart /> Like
        </button>
      </div>
    </div>
  );
};

SwipeCard.propTypes = {
  user: PropTypes.object.isRequired,
  onSwipe: PropTypes.func.isRequired
};

module.exports = SwipeCard;