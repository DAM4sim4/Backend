const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['public', 'private'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  password: { type: String }, // Only for private rooms
  invitees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Invited users for private rooms
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Active participants in the room
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Room', roomSchema);
