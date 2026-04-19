const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const focusController = require('../controllers/focusController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/focus', focusController.index);
router.post('/start', sessionController.start);
router.post('/finish', sessionController.finish);
router.get('/active', sessionController.getActive);
router.post('/abandon', sessionController.abandon);

module.exports = router;
