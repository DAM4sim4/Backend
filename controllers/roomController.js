const Room = require('../models/Room');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Create Room
const createRoom = async (req, res) => {
  const { name, type, password } = req.body;
  const userId = req.userId; // This comes from the verifyToken middleware

  try {
    // Validate input
    if (!name || !type || !['public', 'private'].includes(type)) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // Hash password for private rooms
    let hashedPassword;
    if (type === 'private') {
      if (!password) {
        return res.status(400).json({ message: 'Password is required for private rooms' });
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create the room object
    const newRoom = new Room({
      name,
      type,
      createdBy: userId,
      password: hashedPassword, // Only save password for private rooms
    });

    // Save the room to the database
    await newRoom.save();

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: newRoom._id,
        name: newRoom.name,
        type: newRoom.type,
        createdBy: newRoom.createdBy,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Invite Users
const inviteUsers = async (req, res) => {
    const { roomId } = req.params;
    const { invitees } = req.body; // List of user IDs to invite
    const userId = req.userId; // Set by verifyToken middleware
  
    try {
      // Validate invitees
      if (!invitees || !Array.isArray(invitees) || invitees.length === 0) {
        return res.status(400).json({ message: 'Invitees must be a non-empty array of user IDs' });
      }
  
      // Validate room
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Check if the user is the owner of the room
      if (room.createdBy.toString() !== userId) {
        return res.status(403).json({ message: 'You do not have permission to invite users to this room' });
      }
  
      // Check if the room is private
      if (room.type !== 'private') {
        return res.status(400).json({ message: 'Invitations can only be sent for private rooms' });
      }
  
      // Check if all invitees exist
      const validInvitees = await User.find({ _id: { $in: invitees } });
      if (validInvitees.length !== invitees.length) {
        return res.status(404).json({ message: 'Some invitees do not exist' });
      }
  
      // Prevent duplicate invitations (check if the user is already in the invitees list)
      const uniqueInvitees = invitees.filter(invitee => !room.invitees.includes(invitee));
  
      // If no new invitees, return a message
      if (uniqueInvitees.length === 0) {
        return res.status(400).json({ message: 'All users are already invited' });
      }
  
      // Add invitees to the room's invitees list
      room.invitees = [...new Set([...room.invitees, ...uniqueInvitees])];
      await room.save();
  
      res.status(200).json({
        message: 'Users invited successfully',
        invitees: room.invitees,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

 // Join Room function for private rooms with password
const joinRoom = async (req, res) => {
  const userId = req.userId; // Get the user ID from the token (middleware)
  const { roomName, password } = req.body; // Get room name and password from the request body

  try {
    // Step 1: Check if the room exists by room name
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Step 2: For private rooms, check if the provided password matches the room's password
    if (room.type === 'private') {
      const isPasswordCorrect = await bcrypt.compare(password, room.password);
      if (!isPasswordCorrect) {
        return res.status(403).json({ message: 'Incorrect password' });
      }
    }

    // Step 3: Validate room capacity
    if (room.participants.length >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    // Step 4: Check if the user is already a participant
    const isAlreadyParticipant = room.participants.some(participant => participant.toString() === userId.toString());
    if (isAlreadyParticipant) {
      return res.status(400).json({ message: 'User is already a participant in the room' });
    }

    // Step 5: Add the user to the room as a participant
    room.participants.push(userId);
    await room.save();

    // Return success response
    res.status(200).json({
      message: 'Successfully joined the room',
      room,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave Room function
const leaveRoom = async (req, res) => {
  const userId = req.userId;  // This is set by your verifyToken middleware
  const { roomName } = req.body;  // Get room name from the request body

  try {
    // Check if the room exists
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the user is a participant of the room
    const participantIndex = room.participants.findIndex(participant => participant.toString() === userId.toString());
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'User is not a participant in the room' });
    }

    // Remove the user from the participants array
    room.participants.splice(participantIndex, 1);

    // Save the updated room document
    await room.save();

    // Return success response
    res.status(200).json({
      message: 'Successfully left the room',
      room,  // Returning updated room data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRoomDetails = async (req, res) => {
  const { roomId } = req.params; // Retrieve the room ID from the URL parameter

  try {
    // Find the room by ID
    const room = await Room.findById(roomId)
      .populate('participants', 'nom prenom email') // Populate participants with necessary fields
      .populate('createdBy', 'nom prenom email'); // Populate room creator with necessary fields

    // Check if the room exists
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Return the room details
    res.status(200).json({
      message: 'Room details fetched successfully',
      room: {
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        participants: room.participants, // Participants' details
        subject: room.subject, // Room subject/topic
        createdBy: room.createdBy, // Creator details
        createdAt: room.createdAt,
        videoSessionActive: room.videoSessionActive, // Whether the video session is active
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllRooms = async (req, res) => {
  try {
    // Fetch all rooms and populate participants (if necessary)
    const rooms = await Room.find()
      .populate('participants', 'nom prenom email') // Populate participants with specific fields
      .populate('createdBy', 'nom prenom email'); // Populate room creator with specific fields
    
    // If no rooms found
    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: 'No rooms found' });
    }

    // Return the list of rooms with details
    res.status(200).json({
      message: 'Rooms fetched successfully',
      rooms: rooms.map(room => ({
        id: room._id,
        name: room.name,
        type: room.type,
        createdBy: room.createdBy,
        participantsCount: room.participants.length,
        subject: room.subject,
        videoSessionActive: room.videoSessionActive,
        createdAt: room.createdAt,
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createRoom, inviteUsers, joinRoom, leaveRoom, getRoomDetails, getAllRooms};
