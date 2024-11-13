const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, updatePassword, /*requestPasswordResetController, verifyResetCodeController, resetPasswordController*/} = require('../controllers/userController');
const router = express.Router();
const { verifyToken, authorizeRoles} = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/profile-details', verifyToken, getUserProfile);

router.put('/profile-update', verifyToken, updateUserProfile);

router.put('/update-password', verifyToken, updatePassword);

//router.post('/request-reset-password', requestPasswordResetController);
//router.post('/verify-reset-code', verifyResetCodeController);
//router.put('/reset-password', resetPasswordController);

// Tutor-specific route example
// router.get('/tutor-dashboard', verifyToken, authorizeRoles('tutor', 'admin'));

module.exports = router;
