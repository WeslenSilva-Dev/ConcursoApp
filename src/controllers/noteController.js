const { withPageAssets } = require('../lib/pageAssets');
const noteService = require('../services/noteService');

exports.index = async (req, res, next) => {
  try {
    const { subject } = req.query;
    const { notes, subjects } = await noteService.getNotesPageData(req.user._id, subject);

    res.render('notes/index', withPageAssets({
      title: 'Anotações',
      currentPage: 'notes',
      notes,
      subjects,
      activeSubject: subject || null,
      error: null
    }, {
      pageScripts: ['/js/pages/notes.js']
    }));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await noteService.createNote(req.user._id, req.body);
    if (result.error) {
      const { notes, subjects } = await noteService.getNotesPageData(req.user._id);
      return res.render('notes/index', withPageAssets({
        title: 'Anotações',
        currentPage: 'notes',
        notes,
        subjects,
        activeSubject: null,
        error: result.error
      }, {
        pageScripts: ['/js/pages/notes.js']
      }));
    }

    const subject = req.body.subject?.trim();
    return res.redirect(`/notes${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`);
  } catch (err) {
    return next(err);
  }
};

exports.getEdit = async (req, res, next) => {
  try {
    const note = await noteService.getNote(req.user._id, req.params.id);
    if (!note) return res.json({ success: false });

    return res.json({ success: true, note });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const note = await noteService.updateNote(req.user._id, req.params.id, req.body);
    if (!note) return res.redirect('/notes');

    return res.redirect('/notes');
  } catch (err) {
    return next(err);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    await noteService.deleteNote(req.user._id, req.params.id);
    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
};