const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users in the video call
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active',
  },
  startedAt: { type: Date },
  endedAt: { type: Date },
});

const VideoSession = mongoose.model('VideoSession', videoSessionSchema);

module.exports = VideoSession;
