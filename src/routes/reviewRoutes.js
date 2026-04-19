const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', reviewController.index);
router.patch('/:id/complete', reviewController.complete);

module.exports = router;
