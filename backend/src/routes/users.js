const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/portal', requireAdmin, ctrl.listPortalUsers);
router.post('/portal', requireAdmin, ctrl.createPortalUser);
router.get('/:id', ctrl.getOne);
router.post('/', requireAdmin, ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', requireAdmin, ctrl.remove);

module.exports = router;
