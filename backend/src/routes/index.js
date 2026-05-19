const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/dashboard', require('./dashboard'));
router.use('/accounts', require('./accounts'));
router.use('/contacts', require('./contacts'));
router.use('/cats', require('./cats'));
router.use('/shows', require('./shows'));
router.use('/leads', require('./leads'));
router.use('/opportunities', require('./opportunities'));
router.use('/users', require('./users'));
router.use('/billing', require('./billing'));
router.use('/portal', require('./portal'));
router.use('/activities', require('./activities'));
router.use('/tenants', require('./tenants'));

module.exports = router;
