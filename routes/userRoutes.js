const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile} = require('../controllers/userController');
const router = express.Router();
const { verifyToken} = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/profile-details', verifyToken, getUserProfile);

router.put('/profile-update', verifyToken, updateUserProfile);

module.exports = router;
