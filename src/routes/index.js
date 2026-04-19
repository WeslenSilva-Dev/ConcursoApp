const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const cycleRoutes = require('./cycleRoutes');
const sessionRoutes = require('./sessionRoutes');
const reviewRoutes = require('./reviewRoutes');
const noteRoutes = require('./noteRoutes');
const goalRoutes = require('./goalRoutes');
const statsRoutes = require('./statsRoutes');
const eventRoutes = require('./eventRoutes');

function registerRoutes(app) {
  app.use('/auth', authRoutes);
  app.use('/dashboard', dashboardRoutes);
  app.use('/cycles', cycleRoutes);
  app.use('/sessions', sessionRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/notes', noteRoutes);
  app.use('/goals', goalRoutes);
  app.use('/stats', statsRoutes);
  app.use('/events', eventRoutes);

  app.get('/', (req, res) => res.redirect('/dashboard'));
}

module.exports = registerRoutes;
