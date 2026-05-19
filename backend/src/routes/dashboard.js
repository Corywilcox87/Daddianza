const express = require('express');
const router = express.Router();
const { getStats, getActivityStream } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats', getStats);
router.get('/activity', getActivityStream);

module.exports = router;
