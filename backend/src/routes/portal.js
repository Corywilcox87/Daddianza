const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/portalController');
const { authenticatePortal } = require('../middleware/auth');

router.use(authenticatePortal);
router.get('/profile', ctrl.getProfile);
router.get('/cats', ctrl.getMyCats);
router.get('/entries', ctrl.getMyShowEntries);
router.get('/results', ctrl.getMyResults);
router.get('/shows', ctrl.getUpcomingShows);
router.post('/entries', ctrl.submitEntry);
router.delete('/entries/:entryId', ctrl.withdrawEntry);

module.exports = router;
