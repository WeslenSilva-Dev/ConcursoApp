const { validationResult } = require('express-validator');
const authService = require('../services/authService');

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    layout: 'layouts/auth',
    title: 'Entrar',
    error: req.query.error || null
  });
};

exports.getRegister = (req, res) => {
  res.render('auth/register', {
    layout: 'layouts/auth',
    title: 'Criar Conta',
    error: null
  });
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', {
      layout: 'layouts/auth',
      title: 'Criar Conta',
      error: errors.array()[0].msg,
      body: req.body
    });
  }

  try {
    const user = await authService.registerUser(req.body);
    const token = authService.signToken(user._id);
    authService.sendTokenCookie(res, token);

    return res.redirect('/dashboard');
  } catch (err) {
    return res.render('auth/register', {
      layout: 'layouts/auth',
      title: 'Criar Conta',
      error: err.message,
      body: req.body
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        layout: 'layouts/auth',
        title: 'Entrar',
        error: 'Informe email e senha.'
      });
    }

    const user = await authService.authenticateUser({ email, password });
    const token = authService.signToken(user._id);
    authService.sendTokenCookie(res, token);

    return res.redirect('/dashboard');
  } catch (err) {
    if (err.status === 401) {
      return res.render('auth/login', {
        layout: 'layouts/auth',
        title: 'Entrar',
        error: err.message
      });
    }

    return next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
};
