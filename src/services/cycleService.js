const Cycle = require('../models/Cycle');
const CycleDay = require('../models/CycleDay');
const StudySession = require('../models/StudySession');

function normalizeSubjects(rawSubjects = {}) {
  const names = rawSubjects.name
    ? (Array.isArray(rawSubjects.name) ? rawSubjects.name : [rawSubjects.name])
    : [];
  const durations = rawSubjects.duration
    ? (Array.isArray(rawSubjects.duration) ? rawSubjects.duration : [rawSubjects.duration])
    : [];

  return names
    .map((name, index) => ({
      name: name ? name.trim() : '',
      durationMinutes: parseInt(durations[index], 10)
    }))
    .filter((subject) => subject.name && !Number.isNaN(subject.durationMinutes) && subject.durationMinutes > 0);
}

function validateCyclePayload(name, subjects) {
  if (!name || !name.trim()) {
    return 'Nome do ciclo e obrigatorio';
  }

  if (subjects.length === 0) {
    return 'Adicione pelo menos uma disciplina';
  }

  return null;
}

async function listCycles(userId) {
  const cycles = await Cycle.find({ userId }).sort({ createdAt: -1 });
  return {
    cycles,
    activeCycle: cycles.find((cycle) => cycle.isActive) || null
  };
}

async function createCycle(userId, payload) {
  const subjects = normalizeSubjects(payload.subjects);
  const error = validateCyclePayload(payload.name, subjects);

  if (error) {
    return { error };
  }

  await Cycle.create({
    userId,
    name: payload.name.trim(),
    subjects,
    type: 'manual'
  });

  return { error: null };
}

async function updateCycle(userId, cycleId, payload) {
  const cycle = await Cycle.findOne({ _id: cycleId, userId });
  if (!cycle) {
    return { cycle: null, error: null };
  }

  const subjects = normalizeSubjects(payload.subjects);
  if (!payload.name || !payload.name.trim() || subjects.length === 0) {
    return {
      cycle,
      error: 'Preencha todos os campos corretamente'
    };
  }

  cycle.name = payload.name.trim();
  cycle.subjects = subjects;
  if (cycle.currentIndex >= subjects.length) {
    cycle.currentIndex = 0;
  }

  await cycle.save();
  return { cycle, error: null };
}

async function deleteCycle(userId, cycleId) {
  const cycle = await Cycle.findOne({ _id: cycleId, userId });
  if (!cycle) {
    return;
  }

  await StudySession.updateMany(
    { cycleId: cycle._id, status: 'active' },
    { status: 'abandoned', endTime: new Date() }
  );

  await CycleDay.deleteMany({ cycleId: cycle._id });
  await cycle.deleteOne();
}

async function getCycleDetail(userId, cycleId) {
  const cycle = await Cycle.findOne({ _id: cycleId, userId });
  if (!cycle) {
    return null;
  }

  const cycleDays = await CycleDay.find({ cycleId: cycle._id }).sort({ order: 1 });
  return { cycle, cycleDays };
}

async function activateCycle(userId, cycleId) {
  await Cycle.updateMany({ userId }, { isActive: false });
  const cycle = await Cycle.findOne({ _id: cycleId, userId });

  if (!cycle) {
    return null;
  }

  cycle.isActive = true;
  cycle.currentIndex = 0;
  cycle.lastActiveAt = new Date();
  await cycle.save();

  return cycle;
}

module.exports = {
  activateCycle,
  createCycle,
  deleteCycle,
  getCycleDetail,
  listCycles,
  normalizeSubjects,
  updateCycle,
  validateCyclePayload
};
