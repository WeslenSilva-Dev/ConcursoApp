const Cycle = require('../models/Cycle');
const Review = require('../models/Review');
const StudySession = require('../models/StudySession');
const { withPageAssets } = require('../lib/pageAssets');
const { getGoal } = require('../services/goalService');
const { getDayBounds } = require('../services/reviewService');
const { getStandardStats } = require('../services/statsService');

exports.index = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const stats = await getStandardStats(userId, now);
    const { start, end } = getDayBounds(now);

    const [activeCycle, activeSession, todayReviews, goal] = await Promise.all([
      Cycle.findOne({ userId, isActive: true }),
      StudySession.findOne({ userId, status: 'active' }),
      Review.find({
        userId,
        reviewDate: { $gte: start, $lte: end }
      }).sort({ completed: 1 }),
      getGoal(userId)
    ]);

    const dailyGoalHours = goal?.dailyHours || 4;
    const weeklyGoalHours = goal?.weeklyHours || 20;
    const dailyProgress = Math.min(100, Math.round((stats.todayMinutes / 60 / dailyGoalHours) * 100));
    const weeklyProgress = Math.min(100, Math.round((stats.weekMinutes / 60 / weeklyGoalHours) * 100));

    res.render('dashboard/index', withPageAssets({
      title: 'Dashboard',
      currentPage: 'dashboard',
      todayMinutes: stats.todayMinutes,
      weekMinutes: stats.weekMinutes,
      streak: stats.streak,
      activeCycle,
      activeSession,
      todayReviews,
      goal,
      dailyProgress,
      weeklyProgress,
      dailyGoalHours,
      weeklyGoalHours,
      chartLabels: JSON.stringify(stats.chartLabels),
      chartData: JSON.stringify(stats.chartData),
      subjectLabels: JSON.stringify(stats.subjectLabels),
      subjectData: JSON.stringify(stats.subjectData),
      calendarDays: JSON.stringify(stats.studiedDays)
    }, {
      pageScripts: ['/js/pages/dashboard.js']
    }));
  } catch (err) {
    next(err);
  }
};
