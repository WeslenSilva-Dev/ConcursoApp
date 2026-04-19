const sessionService = require('../services/sessionService');

exports.start = async (req, res, next) => {
  try {
    const session = await sessionService.startSession(req.user._id, req.body);
    res.json({ success: true, sessionId: session._id, startTime: session.startTime });
  } catch (err) {
    next(err);
  }
};

exports.finish = async (req, res, next) => {
  try {
    const result = await sessionService.completeSession(req.user._id, req.body);
    if (result.error) {
      return res.json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      duration: result.duration,
      nextSubject: result.nextSubject
    });
  } catch (err) {
    return next(err);
  }
};

exports.getActive = async (req, res, next) => {
  try {
    const session = await sessionService.getActiveSession(req.user._id);
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

exports.abandon = async (req, res, next) => {
  try {
    await sessionService.abandonActiveSessions(req.user._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
