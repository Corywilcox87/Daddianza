const express = require('express');
const router = express.Router();
const { login, portalLogin, getMe, registerTenant, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/portal/login', portalLogin);
router.post('/register', registerTenant);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
