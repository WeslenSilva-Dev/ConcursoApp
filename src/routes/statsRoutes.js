const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

router.get('/', protect, statsController.index);

module.exports = router;
