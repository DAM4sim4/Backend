const Room = require('../models/Room');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { appId, appCertificate } = require('../config/agoraConfig');
const Joi = require('joi'); // Validation library

// Joi Schema for Validation
const roomValidationSchema = {
    create: Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('public', 'private').required(),
        password: Joi.when('type', {
            is: 'private',
            then: Joi.string().min(6).required(),
            otherwise: Joi.forbidden(),
        }),
    }),
    password: Joi.object({
        password: Joi.string().required(),
    }),
};

// Create Room
const createRoom = async (req, res) => {
    const userId = req.userId;
    const { error, value } = roomValidationSchema.create.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { name, type, password } = value;

    try {
        const hashedPassword = type === 'private' ? await bcrypt.hash(password, 10) : undefined;

        const newRoom = new Room({
            name,
            type,
            createdBy: userId,
            password: hashedPassword,
        });

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
    } catch (err) {
        console.error('Error creating room:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Invite Users
const inviteUsers = async (req, res) => {
    const { roomId } = req.params;
    const { invitees } = req.body;
    const userId = req.userId;

    if (!Array.isArray(invitees) || invitees.length === 0) {
        return res.status(400).json({ message: 'Invitees must be a non-empty array of user IDs' });
    }

    try {
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.createdBy.toString() !== userId) {
            return res.status(403).json({ message: 'You do not have permission to invite users to this room' });
        }

        if (room.type !== 'private') {
            return res.status(400).json({ message: 'Invitations can only be sent for private rooms' });
        }

        const validInvitees = await User.find({ _id: { $in: invitees } });
        if (validInvitees.length !== invitees.length) {
            return res.status(404).json({ message: 'Some invitees do not exist' });
        }

        const uniqueInvitees = invitees.filter((invitee) => !room.invitees.includes(invitee));
        if (uniqueInvitees.length === 0) {
            return res.status(400).json({ message: 'All users are already invited' });
        }

        room.invitees.push(...uniqueInvitees);
        await room.save();

        res.status(200).json({
            message: 'Users invited successfully',
            invitees: room.invitees,
        });
    } catch (error) {
        console.error('Error inviting users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Join Room
const joinRoom = async (req, res) => {
    const userId = req.userId;
    const { roomName, password } = req.body;

    try {
        const room = await Room.findOne({ name: roomName });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.type === 'private') {
            const isPasswordCorrect = await bcrypt.compare(password, room.password || '');
            if (!isPasswordCorrect) {
                return res.status(403).json({ message: 'Incorrect password' });
            }
        }

        if (room.participants.length >= room.capacity) {
            return res.status(400).json({ message: 'Room is full' });
        }

        if (!room.participants.some((participant) => participant.toString() === userId)) {
            room.participants.push(userId);
            await room.save();
        }

        const agoraToken = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            roomName,
            userId,
            RtcRole.PUBLISHER,
            Math.floor(Date.now() / 1000) + 3600 // Token valid for 1 hour
        );

        res.status(200).json({
            message: 'Successfully joined the room',
            room: {
                id: room._id,
                name: room.name,
                type: room.type,
                participants: room.participants,
            },
            agoraToken,
        });
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Leave Room
const leaveRoom = async (req, res) => {
    const userId = req.userId;
    const { roomName } = req.body;

    try {
        const room = await Room.findOne({ name: roomName });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const participantIndex = room.participants.findIndex((participant) => participant.toString() === userId);

        if (participantIndex === -1) {
            return res.status(400).json({ message: 'User is not a participant in the room' });
        }

        room.participants.splice(participantIndex, 1);
        await room.save();

        res.status(200).json({
            message: 'Successfully left the room',
            room,
        });
    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get Room Details
const getRoomDetails = async (req, res) => {
    const { roomId } = req.params;

    try {
        const room = await Room.findById(roomId)
            .populate('participants', 'nom prenom email')
            .populate('createdBy', 'nom prenom email');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json({
            message: 'Room details fetched successfully',
            room,
        });
    } catch (error) {
        console.error('Error fetching room details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get All Rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('participants', 'nom prenom email')
      .populate('createdBy', 'nom prenom email');

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: 'No rooms found' });
    }

    res.status(200).json({
      message: 'Rooms fetched successfully',
      rooms: rooms.map(room => ({
        id: room._id, // Map `_id` to `id` for compatibility with the frontend
        name: room.name,
        type: room.type,
        createdBy: room.createdBy,
        participantsCount: room.participants.length,
        subject: room.subject,
        capacity: room.capacity,
        videoSessionActive: room.videoSessionActive,
        createdAt: room.createdAt,
      })),
    });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify Room Password
const verifyRoomPassword = async (req, res) => {
    const { roomId } = req.params;
    const { error, value } = roomValidationSchema.password.validate(req.body);

    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { password } = value;

    try {
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.type !== 'private') {
            return res.status(400).json({ message: 'This room does not require a password' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, room.password || '');
        if (!isPasswordCorrect) {
            return res.status(403).json({ message: 'Incorrect password' });
        }

        res.status(200).json({ isValid: true });
    } catch (error) {
        console.error('Error verifying room password:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createRoom, inviteUsers, joinRoom, leaveRoom, getRoomDetails, getAllRooms, verifyRoomPassword };