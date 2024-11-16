const express = require('express');
const { createRoom } = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create Room API
router.post('/create-room', verifyToken, createRoom);

module.exports = router;
