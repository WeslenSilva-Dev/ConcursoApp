const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/auth/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.user = user;
    return next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

const redirectIfAuthenticated = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect('/dashboard');
  } catch (err) {
    return next();
  }
};

module.exports = { protect, redirectIfAuthenticated };
