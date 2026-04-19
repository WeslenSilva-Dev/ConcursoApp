const pdfParse = require('pdf-parse');
const { extractText: unpdfExtractText } = require('unpdf');

const MAX_CHARS = 100000;

function cleanText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .trim();
}

function isPdf(file) {
  const name = (file.originalname || '').toLowerCase();
  return (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    (file.mimetype === 'application/octet-stream' && name.endsWith('.pdf')) ||
    name.endsWith('.pdf')
  );
}

function isPlainText(file) {
  const name = (file.originalname || '').toLowerCase();
  return (
    file.mimetype === 'text/plain' ||
    file.mimetype === 'text/markdown' ||
    name.endsWith('.txt') ||
    name.endsWith('.md')
  );
}

async function extractPdfWithPdfParse(buffer) {
  const data = await pdfParse(buffer);
  return cleanText((data && data.text) ? String(data.text) : '');
}

async function extractPdfWithUnpdf(buffer) {
  const result = await unpdfExtractText(new Uint8Array(buffer), { mergePages: false });
  const raw = result && result.text;
  const merged = Array.isArray(raw)
    ? raw.map((page) => String(page || '').trim()).filter(Boolean).join('\n\n')
    : String(raw || '');
  return cleanText(merged);
}

async function extractPdfText(buffer) {
  let primary = '';
  try {
    primary = await extractPdfWithPdfParse(buffer);
  } catch (err) {
    console.warn('[EDITAL_FILE] pdf-parse nao leu o PDF:', err.message);
  }

  let fallback = '';
  try {
    fallback = await extractPdfWithUnpdf(buffer);
  } catch (err) {
    console.warn('[EDITAL_FILE] unpdf nao leu o PDF:', err.message);
  }

  const text = fallback.length > primary.length ? fallback : primary;

  if (!text) {
    throw new Error(
      'Nao foi possivel extrair texto deste PDF. Se for edital escaneado (somente imagem), use OCR ou copie o texto manualmente no campo abaixo.'
    );
  }

  return text;
}

async function extractTextFromUpload(file) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Arquivo invalido ou vazio.');
  }

  let text = '';

  if (isPdf(file)) {
    text = await extractPdfText(file.buffer);
  } else if (isPlainText(file)) {
    text = cleanText(file.buffer.toString('utf8'));
  } else {
    throw new Error('Formato nao suportado. Envie um arquivo PDF ou TXT.');
  }

  if (!text) {
    throw new Error('Nao foi possivel extrair texto do arquivo. Tente outro PDF ou copie o texto manualmente.');
  }

  if (text.length > MAX_CHARS) {
    console.warn('[EDITAL_FILE] Texto truncado para', MAX_CHARS, 'caracteres.');
    text = `${text.slice(0, MAX_CHARS)}\n\n[... trecho omitido por limite de tamanho; o edital e longo ...]`;
  }

  return text;
}

module.exports = {
  extractTextFromUpload,
  MAX_CHARS
};
