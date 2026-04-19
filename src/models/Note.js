const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Disciplina é obrigatória'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    maxlength: [200, 'Título deve ter no máximo 200 caracteres']
  },
  content: {
    type: String,
    required: [true, 'Conteúdo é obrigatório'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for filtering by subject
noteSchema.index({ userId: 1, subject: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
