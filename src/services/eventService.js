const Event = require('../models/Event');

async function getMonthEvents(userId, { month, year }) {
  const prefix = `${year}-${month.padStart(2, '0')}`;
  return Event.find({
    userId,
    date: new RegExp(`^${prefix}`)
  }).sort({ date: 1, createdAt: 1 });
}

async function createEvent(userId, payload) {
  return Event.create({
    userId,
    date: payload.date,
    type: payload.type,
    title: payload.title,
    description: payload.description
  });
}

async function deleteEvent(userId, eventId) {
  await Event.findOneAndDelete({ _id: eventId, userId });
}

module.exports = {
  createEvent,
  deleteEvent,
  getMonthEvents
};
