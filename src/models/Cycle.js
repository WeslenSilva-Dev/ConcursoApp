const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da disciplina e obrigatorio'],
    trim: true
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Tempo da disciplina e obrigatorio'],
    min: [1, 'Tempo minimo e 1 minuto'],
    max: [480, 'Tempo maximo e 480 minutos']
  }
}, { _id: true });

const cycleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Nome do ciclo e obrigatorio'],
    trim: true,
    maxlength: [100, 'Nome deve ter no maximo 100 caracteres']
  },
  type: {
    type: String,
    enum: ['manual', 'gerado_ia'],
    default: 'manual'
  },
  subjects: {
    type: [subjectSchema],
    validate: {
      validator: (value) => value.length >= 1,
      message: 'O ciclo deve ter pelo menos uma disciplina'
    }
  },
  estimatedDurationMinutes: {
    type: Number,
    min: 1
  },
  generationSource: {
    type: String,
    enum: ['gemini', 'fallback']
  },
  generationContext: {
    edital: {
      type: [{
        name: { type: String, trim: true },
        weight: { type: Number, min: 1, max: 5 }
      }],
      default: undefined
    },
    userConfig: {
      hoursPerDay: Number,
      daysPerWeek: Number,
      level: String
    },
    userInstructions: {
      type: String,
      maxlength: 2000,
      trim: true
    }
  },
  currentIndex: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: false
  },
  lastActiveAt: {
    type: Date
  }
}, { timestamps: true });

cycleSchema.pre('save', async function preSave(next) {
  if (this.isModified('isActive') && this.isActive) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isActive: false }
    );
  }

  next();
});

cycleSchema.methods.advance = function advance() {
  this.currentIndex = (this.currentIndex + 1) % this.subjects.length;
  this.lastActiveAt = new Date();
  return this.save();
};

cycleSchema.methods.getCurrentSubject = function getCurrentSubject() {
  return this.subjects[this.currentIndex] || null;
};

module.exports = mongoose.model('Cycle', cycleSchema);
