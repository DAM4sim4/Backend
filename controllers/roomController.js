const Room = require('../models/Room');
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

module.exports = { createRoom };
