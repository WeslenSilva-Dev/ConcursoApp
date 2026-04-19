const mongoose = require('mongoose');

const cycleDaySchema = new mongoose.Schema({
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  denseSubject: {
    type: String,
    required: true,
    trim: true
  },
  denseTimeMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  lightSubject: {
    type: String,
    required: true,
    trim: true
  },
  lightTimeMinutes: {
    type: Number,
    required: true,
    min: 1
  }
}, { timestamps: true });

cycleDaySchema.index({ cycleId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('CycleDay', cycleDaySchema);
