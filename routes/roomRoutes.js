const express = require('express');
const {
  createRoom,
  inviteUsers,
  joinRoom,
  leaveRoom,
  getRoomDetails,
  getAllRooms,
  verifyRoomPassword,
} = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');
const { generateAgoraToken } = require('../controllers/agoraController');

const router = express.Router();

// Room Management Routes
router.post('/create-room', verifyToken, createRoom); // Create a room
router.post('/:roomId/invite', verifyToken, inviteUsers); // Invite users to a room
router.post('/joinRoom', verifyToken, joinRoom); // Join a room
router.post('/leaveRoom', verifyToken, leaveRoom); // Leave a room

// Room Details and Listing Routes
router.get('/roomDetails/:roomId', verifyToken, getRoomDetails); // Get details of a specific room
router.get('/all-rooms', verifyToken, getAllRooms); // Get all rooms

// Agora Token Generation
router.post('/generate-agora-token', verifyToken, generateAgoraToken); // Generate Agora token

// Verify Room Password
router.post('/:roomId/verify-password', verifyToken, verifyRoomPassword); // Verify room password

module.exports = router;