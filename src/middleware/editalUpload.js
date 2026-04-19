const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    if (/\.(pdf|txt|md)$/i.test(name)) {
      return cb(null, true);
    }
    if (['application/pdf', 'application/x-pdf', 'text/plain', 'text/markdown'].includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Envie um arquivo PDF ou TXT.'));
  }
});

function normalizeMultipartBody(req, res, next) {
  const b = req.body || {};
  let edital = [];
  if (typeof b.edital === 'string' && b.edital.trim()) {
    try {
      edital = JSON.parse(b.edital);
    } catch {
      edital = [];
    }
  }

  req.body = {
    cycleName: typeof b.cycleName === 'string' ? b.cycleName : '',
    edital: Array.isArray(edital) ? edital : [],
    editalText: typeof b.editalText === 'string' ? b.editalText : '',
    instrucoesUsuario: typeof b.instrucoesUsuario === 'string' ? b.instrucoesUsuario : '',
    userConfig: {
      horasPorDia: Number(b.horasPorDia),
      diasPorSemana: Number(b.diasPorSemana),
      nivel: b.nivel || 'intermediario'
    }
  };
  next();
}

function maybeMultipart(req, res, next) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (!ct.includes('multipart/form-data')) {
    return next();
  }

  return upload.single('editalFile')(req, res, (err) => {
    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Arquivo muito grande (max. 12 MB).'
          : err.message || 'Erro no upload.';
      return res.status(400).json({ success: false, error: msg });
    }
    return normalizeMultipartBody(req, res, next);
  });
}

module.exports = { maybeMultipart };
