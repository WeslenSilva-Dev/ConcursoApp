const Cycle = require('../models/Cycle');
const CycleDay = require('../models/CycleDay');
const geminiService = require('./geminiService');

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const MAX_PESO = 5;

function normalizeDisciplinesArray(edital) {
  if (!Array.isArray(edital)) return [];

  return edital
    .map((item) => ({
      name: item?.nome || item?.name,
      weight: Number(item?.peso ?? item?.weight)
    }))
    .filter((item) => item.name && Number.isFinite(item.weight) && item.weight > 0)
    .map((item) => ({
      name: String(item.name).trim(),
      weight: clamp(Math.round(item.weight), 1, MAX_PESO)
    }));
}

function normalizeTextEdict(editalText) {
  if (typeof editalText !== 'string' || !editalText.trim()) {
    return null;
  }

  return editalText.trim();
}

function normalizeUserConfig(userConfig = {}) {
  const hoursPerDay = Number(userConfig.horasPorDia ?? userConfig.hoursPerDay);
  const daysPerWeek = Number(userConfig.diasPorSemana ?? userConfig.daysPerWeek);
  const level = String(userConfig.nivel ?? userConfig.level ?? '')
    .trim()
    .toLowerCase() || 'intermediario';

  return { hoursPerDay, daysPerWeek, level };
}

function normalizeInstrucoesUsuario(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (s.length > 2000) {
    return s.slice(0, 2000);
  }
  return s;
}

function validateGenerationInput({ edital, editalText, userConfig, cycleName }) {
  if (!edital.length && !editalText) {
    return 'Informe um edital em texto ou uma lista de disciplinas.';
  }

  if (!Number.isFinite(userConfig.hoursPerDay) || userConfig.hoursPerDay <= 0 || userConfig.hoursPerDay > 12) {
    return 'horasPorDia deve estar entre 0.5 e 12.';
  }

  if (!Number.isFinite(userConfig.daysPerWeek) || userConfig.daysPerWeek < 1 || userConfig.daysPerWeek > 7) {
    return 'diasPorSemana deve estar entre 1 e 7.';
  }

  if (!['iniciante', 'intermediario', 'avancado'].includes(userConfig.level)) {
    return 'nivel deve ser iniciante, intermediario ou avancado.';
  }

  if (cycleName && String(cycleName).trim().length > 100) {
    return 'cycleName deve ter no maximo 100 caracteres.';
  }

  return null;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  }
}

function validateAiCyclePlan(plan) {
  if (!Array.isArray(plan)) {
    throw new Error('Plano retornado pela IA nao e uma lista.');
  }

  if (plan.length < 6 || plan.length > 10) {
    throw new Error('Plano retornado pela IA precisa ter entre 6 e 10 dias.');
  }

  return plan.map((day, index) => {
    const denseDiscipline = String(day?.densa?.disciplina || '').trim();
    const lightDiscipline = String(day?.leve?.disciplina || '').trim();
    const denseTime = Number(day?.densa?.tempo);
    const lightTime = Number(day?.leve?.tempo);

    if (!denseDiscipline || !lightDiscipline) {
      throw new Error(`Dia ${index + 1} retornado pela IA esta invalido.`);
    }

    if (!Number.isFinite(denseTime) || denseTime <= 0 || !Number.isFinite(lightTime) || lightTime <= 0) {
      throw new Error(`Dia ${index + 1} retornado pela IA tem tempos invalidos.`);
    }

    return {
      day: Number(day?.dia) || index + 1,
      dense: {
        discipline: denseDiscipline,
        time: Math.round(denseTime)
      },
      light: {
        discipline: lightDiscipline,
        time: Math.round(lightTime)
      }
    };
  });
}

function buildSubjectsFromPlan(plan) {
  const subjects = new Map();

  plan.forEach((day) => {
    [
      { name: day.dense.discipline, durationMinutes: day.dense.time },
      { name: day.light.discipline, durationMinutes: day.light.time }
    ].forEach((item) => {
      if (!subjects.has(item.name)) {
        subjects.set(item.name, item.durationMinutes);
      }
    });
  });

  return [...subjects.entries()].map(([name, durationMinutes]) => ({
    name,
    durationMinutes
  }));
}

function chooseLightDiscipline(disciplines, denseName, offset) {
  const sorted = [...disciplines].sort((a, b) => a.weight - b.weight);
  const withoutDense = sorted.filter((item) => item.name !== denseName);
  const pool = withoutDense.length ? withoutDense : sorted;
  return pool[offset % pool.length];
}

function generateFallbackCycle(edital, userConfig) {
  if (!edital.length) {
    throw new Error('Nao foi possivel gerar fallback sem disciplinas estruturadas.');
  }

  const totalMinutesPerDay = Math.round(userConfig.hoursPerDay * 60);
  const denseRatioByLevel = {
    iniciante: 0.65,
    intermediario: 0.75,
    avancado: 0.8
  };
  const denseRatio = denseRatioByLevel[userConfig.level] || 0.75;
  const denseMinutes = Math.max(30, Math.round(totalMinutesPerDay * denseRatio));
  const lightMinutes = Math.max(15, totalMinutesPerDay - denseMinutes);
  const totalWeight = edital.reduce((sum, item) => sum + item.weight, 0);
  const days = clamp(Math.max(edital.length * 2, userConfig.daysPerWeek), 6, 10);

  const rankedDense = [...edital]
    .sort((a, b) => b.weight - a.weight)
    .map((item) => ({
      ...item,
      targetDenseDays: Math.max(1, Math.round((item.weight / totalWeight) * days))
    }));

  const denseQueue = rankedDense.flatMap((item) => Array.from({ length: item.targetDenseDays }, () => item));
  while (denseQueue.length < days) {
    denseQueue.push(rankedDense[denseQueue.length % rankedDense.length]);
  }

  const plan = Array.from({ length: days }, (_, index) => {
    const dense = denseQueue[index % denseQueue.length];
    const light = chooseLightDiscipline(edital, dense.name, index);

    return {
      day: index + 1,
      dense: {
        discipline: dense.name,
        time: denseMinutes
      },
      light: {
        discipline: light.name,
        time: lightMinutes
      }
    };
  });

  return {
    source: 'fallback',
    plan
  };
}

async function persistGeneratedCycle({
  userId,
  cycleName,
  edital,
  userConfig,
  plan,
  source,
  userInstructions
}) {
  const subjects = buildSubjectsFromPlan(plan);
  const estimatedDurationMinutes = plan.reduce((sum, day) => sum + day.dense.time + day.light.time, 0);

  const genCtx = {
    edital,
    userConfig
  };
  if (userInstructions) {
    genCtx.userInstructions = userInstructions;
  }

  const cycle = await Cycle.create({
    userId,
    name: cycleName || `Ciclo Gerado ${new Date().toLocaleDateString('pt-BR')}`,
    type: 'gerado_ia',
    subjects,
    estimatedDurationMinutes,
    generationSource: source,
    generationContext: genCtx
  });

  try {
    await CycleDay.insertMany(
      plan.map((day, index) => ({
        cycleId: cycle._id,
        order: index + 1,
        denseSubject: day.dense.discipline,
        denseTimeMinutes: day.dense.time,
        lightSubject: day.light.discipline,
        lightTimeMinutes: day.light.time
      }))
    );
  } catch (err) {
    await cycle.deleteOne();
    throw err;
  }

  return cycle;
}

async function generateAndPersistCycle(userId, payload) {
  const edital = normalizeDisciplinesArray(payload.edital);
  const editalText = normalizeTextEdict(payload.editalText);
  const userConfig = normalizeUserConfig(payload.userConfig);
  const cycleName = payload.cycleName ? String(payload.cycleName).trim() : '';
  const instrucoesUsuario = normalizeInstrucoesUsuario(
    payload.instrucoesUsuario ?? payload.userPrompt ?? payload.instrucoes
  );
  const validationError = validateGenerationInput({
    edital,
    editalText,
    userConfig,
    cycleName
  });

  if (validationError) {
    return { error: validationError };
  }

  let plan;
  let source;
  let geminiRawText = null;

  try {
    const geminiResult = await geminiService.generateCycle({
      edital,
      editalText,
      userConfig,
      instrucoesUsuario
    });
    geminiRawText = geminiResult.rawText;
    plan = validateAiCyclePlan(safeJsonParse(geminiResult.rawText));
    source = 'gemini';
    console.info('[AI_CYCLE] Plano validado com sucesso.');
  } catch (err) {
    console.error('[AI_CYCLE] Falha na Gemini. Aplicando fallback.', err.message);
    try {
      const fallback = generateFallbackCycle(edital, userConfig);
      plan = fallback.plan;
      source = fallback.source;
    } catch (fallbackErr) {
      return {
        error: `Falha ao gerar ciclo automaticamente: ${fallbackErr.message}`,
        details: {
          geminiError: err.message,
          geminiRawText
        }
      };
    }
  }

  const cycle = await persistGeneratedCycle({
    userId,
    cycleName,
    edital,
    userConfig,
    plan,
    source,
    userInstructions: instrucoesUsuario || undefined
  });

  const cycleDays = await CycleDay.find({ cycleId: cycle._id }).sort({ order: 1 });

  return {
    error: null,
    source,
    cycle,
    cycleDays,
    plan
  };
}

module.exports = {
  generateAndPersistCycle,
  generateFallbackCycle,
  normalizeDisciplinesArray,
  normalizeUserConfig,
  validateAiCyclePlan,
  validateGenerationInput
};
