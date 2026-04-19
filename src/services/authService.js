const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function sendTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function registerUser({ name, email, password }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('Email ja cadastrado. Faca login.');
    error.status = 400;
    throw error;
  }

  return User.create({ name, email: normalizedEmail, password });
}

async function authenticateUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Email ou senha incorretos.');
    error.status = 401;
    throw error;
  }

  return user;
}

module.exports = {
  authenticateUser,
  registerUser,
  sendTokenCookie,
  signToken
};
