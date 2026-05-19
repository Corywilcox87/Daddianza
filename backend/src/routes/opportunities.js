const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/opportunityController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/pipeline', ctrl.getPipeline);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
