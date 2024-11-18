const express = require('express');
const { startVideoSession, endVideoSession } = require('../controllers/videoSessionController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Start Video Session
router.post('/start', verifyToken, startVideoSession);

// End Video Session
router.post('/:sessionId/end', verifyToken, endVideoSession);

module.exports = router;
