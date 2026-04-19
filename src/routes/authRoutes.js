const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

router.get('/login', redirectIfAuthenticated, authController.getLogin);
router.get('/register', redirectIfAuthenticated, authController.getRegister);

router.post('/register',
  redirectIfAuthenticated,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
  ],
  authController.register
);

router.post('/login', redirectIfAuthenticated, authController.login);
router.get('/logout', authController.logout);

module.exports = router;
