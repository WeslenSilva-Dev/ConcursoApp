const mongoose = require('mongoose');

const studyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    required: true, // minutes
    min: 1
  },
  date: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession'
  }
}, { timestamps: true });

// Compound index for dashboard queries
studyLogSchema.index({ userId: 1, date: -1 });
studyLogSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('StudyLog', studyLogSchema);
