const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe');
const config = require('../config');
const { success, error, notFound } = require('../utils/apiResponse');

const prisma = new PrismaClient();
const stripeClient = config.stripe.secretKey ? stripe(config.stripe.secretKey) : null;

const getPlans = async (req, res) => {
  return success(res, Object.entries(config.stripe.plans).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: plan.price,
    priceMonthly: (plan.price / 100).toFixed(2),
    maxUsers: plan.maxUsers,
    maxCats: plan.maxCats,
    features: getPlanFeatures(key),
  })));
};

const getPlanFeatures = (plan) => {
  const base = ['CFA Show Tracker', 'Cat Registry', 'Contact Management', 'Client Portal'];
  const professional = [...base, 'CRM Pipeline', 'Lead Management', 'Email Integration', 'Custom Reports'];
  const enterprise = [...professional, 'API Access', 'Custom Domain', 'Priority Support', 'White Label'];
  return plan === 'STARTER' ? base : plan === 'PROFESSIONAL' ? professional : enterprise;
};

const getCurrentSubscription = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    if (!tenant) return notFound(res);

    let stripeData = null;
    if (stripeClient && tenant.stripeSubscriptionId) {
      try {
        const sub = await stripeClient.subscriptions.retrieve(tenant.stripeSubscriptionId);
        stripeData = {
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      } catch (_) {}
    }

    return success(res, {
      plan: tenant.plan,
      status: tenant.status,
      maxUsers: tenant.maxUsers,
      maxCats: tenant.maxCats,
      subscriptionStatus: tenant.subscriptionStatus,
      currentPeriodEnd: tenant.currentPeriodEnd,
      stripeData,
    });
  } catch (err) {
    return error(res, 'Failed to fetch subscription', 500);
  }
};

const createCheckoutSession = async (req, res) => {
  if (!stripeClient) return error(res, 'Billing not configured');
  try {
    const { plan } = req.body;
    const planConfig = config.stripe.plans[plan];
    if (!planConfig) return error(res, 'Invalid plan');

    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });

    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: req.user.email,
        name: tenant.name,
        metadata: { tenantId: tenant.id, tenantSlug: tenant.slug },
      });
      customerId = customer.id;
      await prisma.tenant.update({ where: { id: tenant.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing`,
      metadata: { tenantId: tenant.id, plan },
    });

    return success(res, { url: session.url });
  } catch (err) {
    return error(res, 'Failed to create checkout session', 500);
  }
};

const createPortalSession = async (req, res) => {
  if (!stripeClient) return error(res, 'Billing not configured');
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    if (!tenant.stripeCustomerId) return error(res, 'No billing account found');

    const session = await stripeClient.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/billing`,
    });

    return success(res, { url: session.url });
  } catch (err) {
    return error(res, 'Failed to create portal session', 500);
  }
};

const handleWebhook = async (req, res) => {
  if (!stripeClient) return res.status(200).json({ received: true });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.rawBody, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan;
        if (tenantId && plan) {
          const planConfig = config.stripe.plans[plan];
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan,
              status: 'ACTIVE',
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: 'active',
              maxUsers: planConfig.maxUsers,
              maxCats: planConfig.maxCats,
            },
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const tenant = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              subscriptionStatus: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'ACTIVE' : 'SUSPENDED',
            },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const tenant = await prisma.tenant.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { plan: 'STARTER', status: 'CANCELLED', subscriptionStatus: 'cancelled' },
          });
        }
        break;
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = { getPlans, getCurrentSubscription, createCheckoutSession, createPortalSession, handleWebhook };
