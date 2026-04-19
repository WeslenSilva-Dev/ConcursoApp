const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', eventController.getEvents);
router.post('/', eventController.createEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
