const reviewService = require('../services/reviewService');

exports.index = async (req, res, next) => {
  try {
    const { todayReviews, upcomingReviews, recentCompleted } = await reviewService.getReviewDashboard(req.user._id);
    res.render('reviews/index', {
      title: 'Revisões',
      currentPage: 'reviews',
      todayReviews,
      upcomingReviews,
      recentCompleted
    });
  } catch (err) {
    next(err);
  }
};

exports.complete = async (req, res, next) => {
  try {
    const result = await reviewService.toggleReviewCompletion(req.user._id, req.params.id);
    if (result.error) {
      return res.json({ success: false, error: result.error });
    }

    return res.json({ success: true, completed: result.completed });
  } catch (err) {
    return next(err);
  }
};