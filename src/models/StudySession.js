const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  scheduledDuration: {
    type: Number,
    required: true // minutes
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // actual duration in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  }
}, { timestamps: true });

// Index for finding active sessions quickly
studySessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
