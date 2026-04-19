const Note = require('../models/Note');

function buildNoteDate(date) {
  return date ? new Date(`${date}T12:00:00Z`) : new Date();
}

async function getNotesPageData(userId, subject) {
  const filter = { userId };
  if (subject) {
    filter.subject = subject;
  }

  const [notes, subjects] = await Promise.all([
    Note.find(filter).sort({ createdAt: -1 }),
    Note.distinct('subject', { userId })
  ]);

  return { notes, subjects };
}

async function createNote(userId, payload) {
  const { subject, title, content, date } = payload;

  if (!subject?.trim() || !title?.trim() || !content?.trim()) {
    return { error: 'Preencha todos os campos' };
  }

  await Note.create({
    userId,
    subject: subject.trim(),
    title: title.trim(),
    content: content.trim(),
    date: buildNoteDate(date)
  });

  return { error: null };
}

async function getNote(userId, noteId) {
  return Note.findOne({ _id: noteId, userId });
}

async function updateNote(userId, noteId, payload) {
  const note = await getNote(userId, noteId);
  if (!note) {
    return null;
  }

  note.subject = payload.subject?.trim() || note.subject;
  note.title = payload.title?.trim() || note.title;
  note.content = payload.content?.trim() || note.content;
  if (payload.date) {
    note.date = buildNoteDate(payload.date);
  }

  await note.save();
  return note;
}

async function deleteNote(userId, noteId) {
  await Note.findOneAndDelete({ _id: noteId, userId });
}

module.exports = {
  createNote,
  deleteNote,
  getNote,
  getNotesPageData,
  updateNote
};
