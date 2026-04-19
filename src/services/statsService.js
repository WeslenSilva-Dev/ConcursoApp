const StudyLog = require('../models/StudyLog');
const Event = require('../models/Event');
const Review = require('../models/Review');

function getRangeAtMidnight(referenceDate, offsetDays) {
  const date = new Date(referenceDate);
  date.setDate(referenceDate.getDate() + offsetDays);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sumDurations(logs) {
  return logs.reduce((total, log) => total + (log.duration || 0), 0);
}

function mapLogsByDay(logs) {
  return logs.reduce((accumulator, log) => {
    const dayKey = log.date.toISOString().split('T')[0];
    accumulator[dayKey] = (accumulator[dayKey] || 0) + log.duration;
    return accumulator;
  }, {});
}

function buildDailyChart(weekLogsByDay, now) {
  const labels = [];
  const data = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = getRangeAtMidnight(now, -index);
    const dayKey = date.toISOString().split('T')[0];

    labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }));
    data.push(+(((weekLogsByDay[dayKey] || 0) / 60).toFixed(2)));
  }

  return { labels, data };
}

function buildSubjectBreakdown(logs) {
  const subjectMap = logs.reduce((accumulator, log) => {
    accumulator[log.subject] = (accumulator[log.subject] || 0) + log.duration;
    return accumulator;
  }, {});

  const labels = Object.keys(subjectMap);
  const totalMinutes = Object.values(subjectMap).reduce((accumulator, minutes) => accumulator + minutes, 0);
  const data = labels.map((label) => +((subjectMap[label] / 60).toFixed(2)));
  const breakdown = Object.entries(subjectMap)
    .map(([name, minutes]) => ({
      name,
      hours: +((minutes / 60).toFixed(1)),
      percent: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
    }))
    .sort((left, right) => right.hours - left.hours);

  return { labels, data, breakdown };
}

function calculateStreak({ studyLogs, restEvents, weekRestEvents, now }) {
  const studiedDays = [...new Set(studyLogs.map((log) => log.date.toISOString().split('T')[0]))];
  const restDays = [...new Set(restEvents.map((event) => event.date))];
  const recentRestDays = [...new Set(weekRestEvents.map((event) => event.date))];

  if (recentRestDays.length >= 2) {
    return { streak: 0, studiedDays };
  }

  const today = getRangeAtMidnight(now, 0);
  const todayKey = today.toISOString().split('T')[0];
  let streak = 0;
  let currentDate = new Date(today);

  for (let index = 0; index < 30; index += 1) {
    const dayKey = currentDate.toISOString().split('T')[0];
    const hasStudied = studiedDays.includes(dayKey);
    const isRestDay = restDays.includes(dayKey);

    if (dayKey === todayKey && !hasStudied && !isRestDay) {
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    if (hasStudied || isRestDay) {
      streak += 1;
      currentDate.setDate(currentDate.getDate() - 1);
      continue;
    }

    break;
  }

  return { streak, studiedDays };
}

async function getStandardStats(userId, now = new Date()) {
  const todayStart = getRangeAtMidnight(now, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const sevenDaysAgo = getRangeAtMidnight(now, -6);
  const thirtyDaysAgo = getRangeAtMidnight(now, -29);

  const [todayLogs, weekLogs, thirtyDaysLogs, weekRestEvents, monthRestEvents] = await Promise.all([
    StudyLog.find({ userId, date: { $gte: todayStart, $lte: todayEnd } }),
    StudyLog.find({ userId, date: { $gte: sevenDaysAgo } }),
    StudyLog.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }),
    Event.find({ userId, date: { $gte: sevenDaysAgo.toISOString().split('T')[0] }, type: 'descanso' }),
    Event.find({ userId, date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }, type: 'descanso' })
  ]);

  const todayMinutes = sumDurations(todayLogs);
  const weekMinutes = sumDurations(weekLogs);
  const weekLogsByDay = mapLogsByDay(weekLogs);
  const dailyChart = buildDailyChart(weekLogsByDay, now);
  const subjectBreakdown = buildSubjectBreakdown(thirtyDaysLogs);
  const streakData = calculateStreak({
    studyLogs: thirtyDaysLogs,
    restEvents: monthRestEvents,
    weekRestEvents,
    now
  });

  return {
    todayMinutes,
    weekMinutes,
    streak: streakData.streak,
    chartLabels: dailyChart.labels,
    chartData: dailyChart.data,
    subjectLabels: subjectBreakdown.labels,
    subjectData: subjectBreakdown.data,
    subjectBreakdown: subjectBreakdown.breakdown,
    studiedDays: streakData.studiedDays
  };
}

async function getStatsPageData(userId, now = new Date()) {
  const [stats, totalReviews, completedReviews, allLogs] = await Promise.all([
    getStandardStats(userId, now),
    Review.countDocuments({ userId }),
    Review.countDocuments({ userId, completed: true }),
    StudyLog.find({ userId })
  ]);

  const weekAvg = +((stats.weekMinutes / 60 / 7).toFixed(1));
  const totalMinutes = allLogs.reduce((sum, log) => sum + (log.duration || log.durationMinutes || 0), 0);
  const monthlyLabels = [];
  const monthlyData = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
    const monthMinutes = allLogs
      .filter((log) => log.date >= monthStart && log.date <= monthEnd)
      .reduce((sum, log) => sum + (log.duration || log.durationMinutes || 0), 0);

    monthlyLabels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
    monthlyData.push(+((monthMinutes / 60).toFixed(1)));
  }

  return {
    stats,
    weekAvg,
    totalReviews,
    completedReviews,
    totalHours: +((totalMinutes / 60).toFixed(0)),
    monthlyLabels,
    monthlyData
  };
}

module.exports = {
  getStandardStats,
  getStatsPageData
};
