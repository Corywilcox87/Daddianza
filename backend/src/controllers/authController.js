const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { jwtSecret, jwtExpiresIn, jwtPortalSecret, bcryptRounds } = require('../config');
const { success, error, unauthorized } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const generateToken = (userId, tenantId, role) =>
  jwt.sign({ userId, tenantId, role }, jwtSecret, { expiresIn: jwtExpiresIn });

const generatePortalToken = (portalUserId, tenantId) =>
  jwt.sign({ portalUserId, tenantId }, jwtPortalSecret, { expiresIn: '30d' });

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, slug } = req.body;
    if (!email || !password) return error(res, 'Email and password required');

    let user;
    if (slug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      if (!tenant) return error(res, 'Tenant not found', 404);
      user = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), tenantId: tenant.id },
        include: { tenant: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { email: email.toLowerCase() },
        include: { tenant: true },
      });
    }

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return unauthorized(res, 'Invalid credentials');
    }
    if (!user.isActive) return unauthorized(res, 'Account is inactive');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = generateToken(user.id, user.tenantId, user.role);
    return success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          plan: user.tenant.plan,
          logoUrl: user.tenant.logoUrl,
          primaryColor: user.tenant.primaryColor,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Login failed', 500);
  }
};

// POST /api/auth/portal/login
const portalLogin = async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;
    if (!email || !password || !tenantSlug) return error(res, 'Email, password, and tenant required');

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return error(res, 'Tenant not found', 404);

    const portalUser = await prisma.portalUser.findFirst({
      where: { email: email.toLowerCase(), tenantId: tenant.id },
      include: { tenant: true, contact: true },
    });

    if (!portalUser || !await bcrypt.compare(password, portalUser.passwordHash)) {
      return unauthorized(res, 'Invalid credentials');
    }
    if (!portalUser.isActive) return unauthorized(res, 'Account is inactive');

    await prisma.portalUser.update({ where: { id: portalUser.id }, data: { lastLoginAt: new Date() } });

    const token = generatePortalToken(portalUser.id, portalUser.tenantId);
    return success(res, {
      token,
      user: {
        id: portalUser.id,
        email: portalUser.email,
        firstName: portalUser.firstName,
        lastName: portalUser.lastName,
        contact: portalUser.contact,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      },
    });
  } catch (err) {
    console.error(err);
    return error(res, 'Login failed', 500);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return success(res, {
    id: req.user.id,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    role: req.user.role,
    avatarUrl: req.user.avatarUrl,
    phone: req.user.phone,
    tenant: {
      id: req.user.tenant.id,
      name: req.user.tenant.name,
      slug: req.user.tenant.slug,
      plan: req.user.tenant.plan,
      logoUrl: req.user.tenant.logoUrl,
      primaryColor: req.user.tenant.primaryColor,
    },
  });
};

// POST /api/auth/register-tenant
const registerTenant = async (req, res) => {
  try {
    const { tenantName, slug, firstName, lastName, email, password } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) return error(res, 'This workspace name is already taken');

    const existingEmail = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existingEmail) return error(res, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        plan: 'STARTER',
        status: 'TRIAL',
        maxUsers: 3,
        maxCats: 25,
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: 'ADMIN',
      },
    });

    const token = generateToken(user.id, tenant.id, user.role);
    return success(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
      },
    }, 'Account created successfully', 201);
  } catch (err) {
    console.error(err);
    return error(res, 'Registration failed', 500);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
      return error(res, 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, bcryptRounds);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return success(res, null, 'Password changed successfully');
  } catch (err) {
    return error(res, 'Failed to change password', 500);
  }
};

module.exports = { login, portalLogin, getMe, registerTenant, changePassword };
