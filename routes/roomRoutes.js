const express = require('express');
const { createRoom, inviteUsers, joinRoom} = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create Room API
router.post('/create-room', verifyToken, createRoom);

// Invite Users API
router.post('/:roomId/invite', verifyToken, inviteUsers);

// Route to join a room 
router.post('/joinRoom', verifyToken, joinRoom);

module.exports = router;
