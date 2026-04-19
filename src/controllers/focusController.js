const Cycle = require('../models/Cycle');
const StudySession = require('../models/StudySession');

// GET /focus
exports.index = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [activeCycle, activeSession] = await Promise.all([
      Cycle.findOne({ userId, isActive: true }),
      StudySession.findOne({ userId, status: 'active' })
    ]);

    if (!activeCycle) {
      return res.redirect('/cycles');
    }

    const currentSubject = activeCycle.getCurrentSubject();

    res.render('focus/index', {
      title: 'Modo Foco',
      currentPage: 'focus',
      layout: 'layouts/focus',
      activeCycle,
      currentSubject,
      activeSession,
      subjectIndex: activeCycle.currentIndex,
      totalSubjects: activeCycle.subjects.length
    });
  } catch (err) { next(err); }
};
