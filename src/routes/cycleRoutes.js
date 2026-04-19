const express = require('express');
const router = express.Router();
const cycleController = require('../controllers/cycleController');
const { protect } = require('../middleware/auth');
const { maybeMultipart } = require('../middleware/editalUpload');

router.use(protect);

router.get('/', cycleController.index);
router.get('/create', cycleController.getCreate);
router.post('/generate-with-ai', maybeMultipart, cycleController.generateWithAI);
router.post('/', cycleController.create);
router.get('/:id', cycleController.show);
router.get('/:id/edit', cycleController.getEdit);
router.put('/:id', cycleController.update);
router.delete('/:id', cycleController.destroy);
router.post('/:id/activate', cycleController.activate);

module.exports = router;
