const VideoSession = require('../models/VideoSession');
const Room = require('../models/Room');

// Start Video Session
const startVideoSession = async (req, res) => {
  const { roomId } = req.body;

  try {
      const room = await Room.findById(roomId);
      if (!room) {
          return res.status(404).json({ message: 'Room not found' });
      }

      let session = await VideoSession.findOne({ roomId, status: 'active' });
      if (session) {
          return res.status(400).json({ message: 'Video session already active' });
      }

      session = new VideoSession({
          roomId,
          participants: [req.userId],
          startedAt: new Date()
      });

      await session.save();
      res.status(201).json({ message: 'Video session started', session });
  } catch (error) {
      console.error('Error starting video session:', error.message);
      res.status(500).json({ message: 'Server error' });
  }
};

// End Video Session
const endVideoSession = async (req, res) => {
    const { sessionId } = req.params;
  
    try {
      // Find the video session by ID
      const session = await VideoSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
  
      // Check if the session is already ended
      if (session.status === 'ended') {
        return res.status(400).json({ message: 'Session has already ended' });
      }
  
      // Remove the user from the session's participants
      const userIndex = session.participants.indexOf(req.userId);
      if (userIndex === -1) {
        return res.status(400).json({ message: 'User not part of this session' });
      }
  
      session.participants.splice(userIndex, 1); // Remove the user
  
      // If no participants are left, end the session
      if (session.participants.length === 0) {
        session.status = 'ended';
        session.endedAt = Date.now();
      }
  
      // Save the updated session
      await session.save();
  
      res.status(200).json({
        message: 'Video session ended successfully',
        session: {
          id: session._id,
          roomId: session.roomId,
          participants: session.participants,
          status: session.status,
          endedAt: session.endedAt,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  module.exports = { startVideoSession, endVideoSession };
  
