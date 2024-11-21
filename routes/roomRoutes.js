const express = require('express');
const { createRoom, inviteUsers, joinRoom, leaveRoom, getRoomDetails, getAllRooms} = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');


const router = express.Router();


// Create Room API
router.post('/create-room', verifyToken, createRoom);

// Invite Users API
router.post('/:roomId/invite', verifyToken, inviteUsers);

// Route to join a room 
router.post('/joinRoom', verifyToken, joinRoom);

// Route to leave a room (POST request with roomName in body)
router.post('/leaveRoom', verifyToken, leaveRoom);

// Define the GET route for fetching room details
router.get('/roomDetails/:roomId', verifyToken, getRoomDetails);

// Define the GET route for fetching all rooms
router.get('/all-rooms', verifyToken, getAllRooms);

module.exports = router;
