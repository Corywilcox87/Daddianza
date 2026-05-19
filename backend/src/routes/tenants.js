const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tenantController');
const { authenticate, requireSuperAdmin, requireAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireSuperAdmin, ctrl.list);
router.get('/:id', requireSuperAdmin, ctrl.getOne);
router.put('/:id', requireSuperAdmin, ctrl.update);
router.put('/own/settings', requireAdmin, ctrl.updateOwn);

module.exports = router;
