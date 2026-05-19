const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/showController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:id/stats', ctrl.getShowStats);
router.get('/:id/entries', ctrl.listEntries);
router.get('/:id/results', ctrl.listResults);
router.post('/', ctrl.create);
router.post('/:id/entries', ctrl.createEntry);
router.post('/:id/results', ctrl.saveResult);
router.put('/:id', ctrl.update);
router.put('/:id/entries/:entryId', ctrl.updateEntry);
router.delete('/:id', ctrl.remove);
router.delete('/:id/entries/:entryId', ctrl.deleteEntry);

module.exports = router;
