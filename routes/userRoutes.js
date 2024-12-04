const express = require('express');
const { forgotPassword, verifyRecoveryCode,resetPasswordWithOTP,registerUser, loginUser, logoutUser,getUserProfile, updateUserProfile, banUser, unbanUser, getAllStudents, updatePassword} = require('../controllers/userController');
const router = express.Router();
const { verifyToken, authorizeRoles, passport } = require('../middleware/authMiddleware');


// Password Recovery: Send Recovery Code
router.post('/send-recovery-code', forgotPassword);

// Password Recovery: Verify Recovery Code
router.post('/verify-recovery-code', verifyRecoveryCode);

// Password Recovery: Reset Password
router.post('/reset-password', resetPasswordWithOTP);




// Register route
router.post('/register', registerUser);

router.post('/login', loginUser);
// Logout route
router.post('/logout', verifyToken, logoutUser); // Add the logout route

router.get('/profile-details', verifyToken, getUserProfile);

router.put('/profile-update', verifyToken, updateUserProfile);


router.put('/ban/:id', verifyToken, authorizeRoles('admin'), banUser);


router.put('/unban/:id', verifyToken, authorizeRoles('admin'), unbanUser);

router.get('/get-all-students', verifyToken, authorizeRoles('admin'), getAllStudents);

router.put('/update-password', verifyToken, updatePassword);

router.post('/forgot-password', forgotPassword);
router.post('/verify-recovery-code', verifyRecoveryCode);
router.post('/reset-password', resetPasswordWithOTP);

// Tutor-specific route example
// router.get('/tutor-dashboard', verifyToken, authorizeRoles('tutor', 'admin'));

// Route to initiate Google authentication
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback route for Google to redirect to after successful authentication
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // Send the JWT token to the client on successful login
    const { token } = req.user;
    res.json({ message: 'Authentication successful', token });
  }
);

module.exports = router;
