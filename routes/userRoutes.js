const express = require('express');
const { forgotPassword, verifyRecoveryCode,registerUser, loginUser, logoutUser,getUserProfile, updateUserProfile, banUser, unbanUser, getAllStudents, updatePassword} = require('../controllers/userController');
const router = express.Router();
const { verifyToken, authorizeRoles, passport } = require('../middleware/authMiddleware');

const twilioService = require('../twilioService');

// Route to send OTP to the user
router.post('/send-recovery-code', (req, res) => {
    const { input } = req.body; // User's phone number or email

    // Assume input is phone number here, if it's email use a different method to send email OTP
    twilioService.sendOTP(input)
        .then(() => {
            res.status(200).send({ message: 'OTP sent successfully' });
        })
        .catch((error) => {
            res.status(500).send({ error: 'Failed to send OTP' });
        });
});

// Route to verify OTP
router.post('/verify-recovery-code', (req, res) => {
  const { input, recoveryCode } = req.body; // input is phone number or email, recoveryCode is OTP

  if (twilioService.verifyOTP(input, recoveryCode)) {
      res.status(200).send({ message: 'OTP verified successfully' });
  } else {
      res.status(400).send({ error: 'Invalid or expired OTP' });
  }
});




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
