const express = require('express');
const { createRoom, inviteUsers } = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create Room API
router.post('/create-room', verifyToken, createRoom);

// Invite Users API
router.post('/:roomId/invite', verifyToken, inviteUsers);

module.exports = router;
