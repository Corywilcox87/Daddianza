const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/catController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.get('/:id/show-history', ctrl.getShowHistory);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
