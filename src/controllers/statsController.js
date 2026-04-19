const { withPageAssets } = require('../lib/pageAssets');
const { getStatsPageData } = require('../services/statsService');

exports.index = async (req, res, next) => {
  try {
    const pageData = await getStatsPageData(req.user._id, new Date());

    res.render('stats/index', withPageAssets({
      title: 'Estatísticas',
      currentPage: 'stats',
      weekTotal: +(pageData.stats.weekMinutes / 60).toFixed(1),
      weekAvg: pageData.weekAvg,
      streak: pageData.stats.streak,
      totalHours: pageData.totalHours,
      totalReviews: pageData.totalReviews,
      completedReviews: pageData.completedReviews,
      dailyLabels: JSON.stringify(pageData.stats.chartLabels),
      dailyData: JSON.stringify(pageData.stats.chartData),
      subjectStats: JSON.stringify(pageData.stats.subjectBreakdown.slice(0, 8)),
      monthlyLabels: JSON.stringify(pageData.monthlyLabels),
      monthlyData: JSON.stringify(pageData.monthlyData)
    }, {
      pageScripts: ['/js/pages/stats.js']
    }));
  } catch (err) {
    next(err);
  }
};