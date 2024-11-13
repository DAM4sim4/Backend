const express = require('express');
const { registerUser, loginUser, getUserProfile, updateUserProfile, banUser, unbanUser, getAllStudents} = require('../controllers/userController');
const router = express.Router();
const { verifyToken, authorizeRoles} = require('../middleware/authMiddleware');

// Register route
router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/profile-details', verifyToken, getUserProfile);

router.put('/profile-update', verifyToken, updateUserProfile);


router.put('/ban/:id', verifyToken, authorizeRoles('admin'), banUser);


router.put('/unban/:id', verifyToken, authorizeRoles('admin'), unbanUser);

router.get('/get-all-students', verifyToken, authorizeRoles('admin'), getAllStudents);

// Tutor-specific route example
// router.get('/tutor-dashboard', verifyToken, authorizeRoles('tutor', 'admin'));

module.exports = router;
