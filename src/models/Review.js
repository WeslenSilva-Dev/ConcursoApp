const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  reviewDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  studyLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyLog'
  },
  interval: {
    type: Number, // days: 1, 7, or 30
    enum: [1, 7, 30]
  }
}, { timestamps: true });

// Index for daily queries
reviewSchema.index({ userId: 1, reviewDate: 1, completed: 1 });

module.exports = mongoose.model('Review', reviewSchema);
