const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users in the video call
  startedAt: { type: Date },
  endedAt: { type: Date },
});

module.exports = mongoose.model('VideoSession', videoSessionSchema);
