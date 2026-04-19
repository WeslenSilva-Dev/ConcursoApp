const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', noteController.index);
router.post('/', noteController.create);
router.get('/:id/edit', noteController.getEdit);
router.put('/:id', noteController.update);
router.delete('/:id', noteController.destroy);

module.exports = router;
