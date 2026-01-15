const React = require('react');
const { useState, useEffect, useRef } = require('react');
const PropTypes = require('prop-types');
const { io } = require('socket.io-client');
const { useSelector } = require('react-redux');
const { FaPaperPlane, FaImage, FaSmile } = require('react-icons/fa');

const ChatWindow = ({ matchId, otherUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Connect to socket
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    setSocket(newSocket);
    
    // Register user with socket
    if (user && user.id) {
      newSocket.emit('register', user.id);
    }
    
    // Load existing messages
    loadMessages();
    
    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [matchId, user]);
  
  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('receive_message', (message) => {
        if (message.matchId === matchId) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });
      
      // Listen for typing indicator
      socket.on('user_typing', (data) => {
        if (data.matchId === matchId && data.userId !== user.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1000);
        }
      });
    }
  }, [socket, matchId, user]);
  
  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${matchId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageData = {
      matchId,
      content: newMessage,
      senderId: user.id,
      receiverId: otherUser.id,
      timestamp: new Date().toISOString()
    };
    
    // Send via socket
    if (socket) {
      socket.emit('send_message', messageData);
    }
    
    // Also send to API for persistence
    try {
      await fetch(`/api/messages/${matchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: newMessage })
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
    
    // Add to local state
    setMessages(prev => [...prev, {
      ...messageData,
      sender: user,
      isSent: true
    }]);
    
    setNewMessage('');
    scrollToBottom();
  };
  
  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', {
        matchId,
        userId: user.id,
        receiverId: otherUser.id
      });
    }
  };
  
  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <img 
          src={otherUser.profile.photos[0]?.url || '/default-avatar.png'} 
          alt={otherUser.profile.name}
          className="chat-avatar"
        />
        <div className="chat-user-info">
          <h3>{otherUser.profile.name}</h3>
          <span className="user-status">
            {isTyping ? 'Typing...' : 'Online'}
          </span>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.senderId === user.id ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              {message.content}
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <button type="button" className="btn-attachment">
          <FaImage />
        </button>
        
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="message-input"
        />
        
        <button type="button" className="btn-emoji">
          <FaSmile />
        </button>
        
        <button type="submit" className="btn-send">
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

ChatWindow.propTypes = {
  matchId: PropTypes.string.isRequired,
  otherUser: PropTypes.object.isRequired
};

module.exports = ChatWindow;