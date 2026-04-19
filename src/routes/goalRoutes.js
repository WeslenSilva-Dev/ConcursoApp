const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', goalController.index);
router.post('/', goalController.upsert);

module.exports = router;
