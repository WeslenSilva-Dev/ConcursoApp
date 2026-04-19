const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  console.error(`[ERROR] ${status} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(status).json({ success: false, error: message });
  }

  return res.status(status).render('error', {
    title: `Erro ${status}`,
    message,
    currentPage: '',
    layout: 'layouts/auth'
  });
};

module.exports = errorHandler;
