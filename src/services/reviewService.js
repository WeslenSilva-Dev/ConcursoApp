const Review = require('../models/Review');

function getDayBounds(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function getReviewDashboard(userId, referenceDate = new Date()) {
  const { start: todayStart, end: todayEnd } = getDayBounds(referenceDate);
  const nextWeek = new Date(referenceDate);
  nextWeek.setDate(referenceDate.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  const [todayReviews, upcomingReviews, recentCompleted] = await Promise.all([
    Review.find({
      userId,
      reviewDate: { $gte: todayStart, $lte: todayEnd }
    }).sort({ completed: 1, subject: 1 }),
    Review.find({
      userId,
      reviewDate: { $gt: todayEnd, $lte: nextWeek },
      completed: false
    }).sort({ reviewDate: 1 }),
    Review.find({ userId, completed: true }).sort({ completedAt: -1 }).limit(10)
  ]);

  return { todayReviews, upcomingReviews, recentCompleted };
}

async function toggleReviewCompletion(userId, reviewId) {
  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    return { error: 'Revisao nao encontrada' };
  }

  review.completed = !review.completed;
  review.completedAt = review.completed ? new Date() : null;
  await review.save();

  return { completed: review.completed, error: null };
}

module.exports = {
  getDayBounds,
  getReviewDashboard,
  toggleReviewCompletion
};
