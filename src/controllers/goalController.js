const { withPageAssets } = require('../lib/pageAssets');
const goalService = require('../services/goalService');

exports.index = async (req, res, next) => {
  try {
    const goal = await goalService.getGoal(req.user._id);
    res.render('goals/index', withPageAssets({
      title: 'Metas de Estudo',
      currentPage: 'goals',
      goal,
      success: req.query.success || null
    }, {
      pageScripts: ['/js/pages/goals.js']
    }));
  } catch (err) {
    next(err);
  }
};

exports.upsert = async (req, res, next) => {
  try {
    const result = await goalService.upsertGoal(req.user._id, req.body);
    if (result.error) {
      const goal = await goalService.getGoal(req.user._id);
      return res.render('goals/index', withPageAssets({
        title: 'Metas de Estudo',
        currentPage: 'goals',
        goal,
        success: null,
        error: result.error
      }, {
        pageScripts: ['/js/pages/goals.js']
      }));
    }

    return res.redirect('/goals?success=1');
  } catch (err) {
    return next(err);
  }
};
