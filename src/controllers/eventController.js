const eventService = require('../services/eventService');

exports.getEvents = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Mes e ano requeridos' });
    }

    const events = await eventService.getMonthEvents(req.user._id, { month, year });
    return res.json({ success: true, events });
  } catch (err) {
    return next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.user._id, req.body);
    return res.json({ success: true, event });
  } catch (err) {
    return next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.user._id, req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};
