const Goal = require('../models/Goal');

async function getGoal(userId) {
  return Goal.findOne({ userId });
}

async function upsertGoal(userId, { dailyHours, weeklyHours }) {
  const daily = parseFloat(dailyHours);
  const weekly = parseFloat(weeklyHours);

  if (!daily || !weekly || daily < 0.5 || weekly < 1) {
    return {
      error: 'Informe valores validos para as metas'
    };
  }

  await Goal.findOneAndUpdate(
    { userId },
    { dailyHours: daily, weeklyHours: weekly },
    { upsert: true, new: true }
  );

  return { error: null };
}

module.exports = {
  getGoal,
  upsertGoal
};
