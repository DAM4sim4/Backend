const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, banUser, unbanUser, getAllStudents, updatePassword, getUserDetails} = require('../controllers/userController');
const router = express.Router();
const { verifyToken, authorizeRoles, passport } = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/profile-details', verifyToken, getUserProfile);

router.put('/profile-update', verifyToken, updateUserProfile);


router.put('/ban/:id', verifyToken, authorizeRoles('admin'), banUser);


router.put('/unban/:id', verifyToken, authorizeRoles('admin'), unbanUser);

router.get('/get-all-students', verifyToken, authorizeRoles('admin'), getAllStudents);

router.get('/get-user-details/:id', verifyToken, authorizeRoles('admin'), getUserDetails);

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
