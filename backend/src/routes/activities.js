const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/notes', ctrl.createNote);
router.delete('/notes/:id', ctrl.deleteNote);

module.exports = router;
