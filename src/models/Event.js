const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['estudo', 'simulado', 'descanso', 'revisao', 'edital', 'outro'],
    default: 'estudo'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

eventSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
