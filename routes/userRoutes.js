const express = require('express');
const { 
  forgotPassword, 
  verifyRecoveryCode, 
  resetPasswordWithOTP, 
  registerUser, 
  loginUser, 
  logoutUser, 
  getUserProfile, 
  updateUserProfile, 
  banUser, 
  unbanUser, 
  getAllStudents, 
  updatePassword 
} = require('../controllers/userController');
const router = express.Router();
const { verifyToken, authorizeRoles, passport } = require('../middleware/authMiddleware');

// Password Recovery
router.post('/send-recovery-code', forgotPassword);
router.post('/verify-recovery-code', verifyRecoveryCode);
router.post('/reset-password', resetPasswordWithOTP);

// User Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', verifyToken, logoutUser);

// User Profile
router.get('/profile-details', verifyToken, getUserProfile);
router.put('/profile-update', verifyToken, updateUserProfile);

// Admin User Management
router.put('/ban/:id', verifyToken, authorizeRoles('admin'), banUser);
router.put('/unban/:id', verifyToken, authorizeRoles('admin'), unbanUser);
router.get('/get-all-students', verifyToken, authorizeRoles('admin'), getAllStudents);
router.put('/update-password', verifyToken, updatePassword);

// Google Authentication
// Initiate Google login
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Handle Google login callback
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Error during Google authentication:', err.message);
      return res.status(500).json({ message: 'Internal server error during Google authentication.' });
    }

    if (!user) {
      console.error('Google authentication failed:', info);
      return res.status(401).json({ message: 'Google authentication failed.' });
    }

    const { token } = user; // The token is generated in the strategy
    res.status(200).json({ message: 'Authentication successful', token });
  })(req, res, next);
});

module.exports = router;