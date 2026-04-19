const Cycle = require('../models/Cycle');
const Review = require('../models/Review');
const StudyLog = require('../models/StudyLog');
const StudySession = require('../models/StudySession');

async function abandonActiveSessions(userId) {
  await StudySession.updateMany(
    { userId, status: 'active' },
    { status: 'abandoned', endTime: new Date() }
  );
}

async function startSession(userId, { cycleId, subject, scheduledDuration }) {
  await abandonActiveSessions(userId);

  return StudySession.create({
    userId,
    cycleId,
    subject,
    scheduledDuration: parseInt(scheduledDuration, 10),
    startTime: new Date(),
    status: 'active'
  });
}

function buildReviewDates(baseDate) {
  return [1, 7, 30].map((interval) => {
    const reviewDate = new Date(baseDate);
    reviewDate.setDate(reviewDate.getDate() + interval);

    return { interval, reviewDate };
  });
}

async function completeSession(userId, { sessionId, actualDuration }) {
  const session = await StudySession.findOne({
    _id: sessionId,
    userId,
    status: 'active'
  });

  if (!session) {
    return { error: 'Sessao nao encontrada' };
  }

  const duration = parseInt(actualDuration, 10)
    || Math.ceil((Date.now() - session.startTime) / 60000);

  session.endTime = new Date();
  session.duration = duration;
  session.status = 'completed';
  await session.save();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studyLog = await StudyLog.create({
    userId,
    subject: session.subject,
    duration,
    date: today,
    sessionId: session._id
  });

  await Review.insertMany(
    buildReviewDates(today).map(({ interval, reviewDate }) => ({
      userId,
      subject: session.subject,
      reviewDate,
      completed: false,
      studyLogId: studyLog._id,
      interval
    }))
  );

  const cycle = await Cycle.findById(session.cycleId);
  if (cycle && cycle.isActive) {
    await cycle.advance();
  }

  return {
    error: null,
    duration,
    nextSubject: cycle ? cycle.getCurrentSubject() : null
  };
}

async function getActiveSession(userId) {
  return StudySession.findOne({ userId, status: 'active' });
}

module.exports = {
  abandonActiveSessions,
  completeSession,
  getActiveSession,
  startSession
};
