const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

// Stripe webhooks must receive raw body
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

router.use(authenticate);
router.get('/plans', ctrl.getPlans);
router.get('/subscription', ctrl.getCurrentSubscription);
router.post('/checkout', ctrl.createCheckoutSession);
router.post('/portal', ctrl.createPortalSession);

module.exports = router;
