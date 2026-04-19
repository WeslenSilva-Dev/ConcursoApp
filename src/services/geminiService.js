const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-2.5-flash';

function getModelName() {
  const configured = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  return configured.replace(/^models\//, '');
}

function normalizeDisciplinesForPrompt(edital = []) {
  return edital.map((item) => ({
    nome: item.name,
    peso: item.weight
  }));
}

function buildPrompt({ edital, editalText, userConfig, instrucoesUsuario }) {
  const hasText = typeof editalText === 'string' && editalText.trim().length > 0;
  const hasDisciplines = Array.isArray(edital) && edital.length > 0;
  const hasInstrucoes =
    typeof instrucoesUsuario === 'string' && instrucoesUsuario.trim().length > 0;

  const editalPayload = {};
  if (hasText) {
    editalPayload.texto_do_edital = editalText.trim();
  }
  if (hasDisciplines) {
    editalPayload.disciplinas_com_peso = normalizeDisciplinesForPrompt(edital);
  }

  const lines = [
    'Voce e um planejador de estudos para concursos publicos.',
    'Analise o conteudo do edital (e as disciplinas com peso, se fornecidas) e gere um ciclo de estudos otimizado e pragmatico.',
    'Se houver texto completo ou trecho do edital, use-o como fonte principal para nomes de disciplinas, cargas e enfase.',
    'Peso das disciplinas informadas pelo usuario: escala de 1 a 5 (5 = maior importancia relativa no edital).',
    'Se o edital descrever varios cargos, vagas ou areas e o usuario nao especificar o recorte, escolha o primeiro bloco de disciplinas de forma coerente; se o usuario especificar cargo/vaga/area nas instrucoes abaixo, o plano deve considerar SOMENTE o conteudo do edital relativo a esse recorte (ignore provas ou disciplinas de outros cargos).',
    'Regras obrigatorias:',
    '- Retorne apenas JSON valido, sem markdown e sem comentarios.',
    '- Gere entre 6 e 10 dias.',
    '- Cada dia precisa ter exatamente 1 disciplina densa e 1 disciplina leve.',
    '- Distribua o tempo com base nos pesos informados (1 a 5); se nao houver peso, infira do edital (provas com mais pontuacao = mais tempo).',
    '- Use o tempo diario disponivel do usuario.',
    '- Evite usar a mesma disciplina como densa e leve no mesmo dia.',
    ''
  ];

  if (hasInstrucoes) {
    lines.push(
      'Instrucoes do candidato (prioridade alta — siga literalmente quando compativel com o edital):',
      instrucoesUsuario.trim(),
      ''
    );
  }

  lines.push(
    'Formato esperado:',
    '[',
    '  {',
    '    "dia": 1,',
    '    "densa": { "disciplina": "Tecnologia da Informacao", "tempo": 90 },',
    '    "leve": { "disciplina": "Portugues", "tempo": 30 }',
    '  }',
    ']',
    '',
    'Entrada:',
    JSON.stringify({
      edital: editalPayload,
      userConfig: {
        horasPorDia: userConfig.hoursPerDay,
        diasPorSemana: userConfig.daysPerWeek,
        nivel: userConfig.level
      }
    }, null, 2)
  );

  return lines.join('\n');
}

function baseGenerationConfig() {
  return {
    temperature: 0.3,
    responseMimeType: 'application/json'
  };
}

function logThoughtSummariesIfDev(response) {
  if (process.env.NODE_ENV === 'production') return;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return;

  parts.forEach((part, index) => {
    if (part && part.thought === true && typeof part.text === 'string' && part.text.trim()) {
      const preview = part.text.length > 400 ? `${part.text.slice(0, 400)}…` : part.text;
      console.info(`[AI_CYCLE] resumo do pensamento (${index}):`, preview);
    }
  });
}

function errorMessage(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err.message) return String(err.message);
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function looksLikeThinkingUnsupported(err) {
  const msg = errorMessage(err);
  return /thinking/i.test(msg) && (/not supported/i.test(msg) || /INVALID_ARGUMENT/i.test(msg));
}

async function generateCycle({ edital, editalText, userConfig, instrucoesUsuario }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nao configurada.');
  }

  const model = getModelName();
  const prompt = buildPrompt({ edital, editalText, userConfig, instrucoesUsuario });

  console.info('[AI_CYCLE] Enviando prompt para Gemini', {
    model,
    disciplines: edital?.length || 0,
    hasTextInput: Boolean(editalText),
    hasUserInstructions: Boolean(instrucoesUsuario && String(instrucoesUsuario).trim())
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const useThinking = process.env.GEMINI_USE_THINKING === 'true';

  let response;

  if (useThinking) {
    try {
      response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          ...baseGenerationConfig(),
          thinkingConfig: {
            includeThoughts: true
          }
        }
      });
    } catch (err) {
      if (looksLikeThinkingUnsupported(err)) {
        console.warn('[AI_CYCLE] Thinking nao suportado neste modelo; repetindo sem thinking.', errorMessage(err));
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: baseGenerationConfig()
        });
      } else {
        throw err;
      }
    }
  } else {
    response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: baseGenerationConfig()
    });
  }

  logThoughtSummariesIfDev(response);

  const rawText = response.text;
  if (!rawText || !rawText.trim()) {
    throw new Error('Gemini retornou conteudo vazio.');
  }

  return {
    rawText: rawText.trim(),
    rawResponse: response
  };
}

module.exports = {
  buildPrompt,
  generateCycle
};
