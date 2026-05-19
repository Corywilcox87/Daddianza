const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { jwtSecret, jwtPortalSecret } = require('../config');
const { unauthorized, forbidden } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, tenantId: decoded.tenantId, isActive: true },
      include: { tenant: true },
    });

    if (!user) return unauthorized(res, 'User not found or inactive');
    if (user.tenant.status === 'SUSPENDED') return forbidden(res, 'Account suspended');

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    return unauthorized(res, 'Invalid token');
  }
};

const authenticatePortal = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtPortalSecret);

    const portalUser = await prisma.portalUser.findFirst({
      where: { id: decoded.portalUserId, tenantId: decoded.tenantId, isActive: true },
      include: { tenant: true, contact: true },
    });

    if (!portalUser) return unauthorized(res, 'Portal user not found or inactive');
    if (portalUser.tenant.status === 'SUSPENDED') return forbidden(res, 'Account suspended');

    req.portalUser = portalUser;
    req.tenantId = portalUser.tenantId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
    return unauthorized(res, 'Invalid token');
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return unauthorized(res);
  if (!roles.includes(req.user.role)) {
    return forbidden(res, 'Insufficient permissions');
  }
  next();
};

const requireSuperAdmin = requireRole('SUPER_ADMIN');
const requireAdmin = requireRole('SUPER_ADMIN', 'ADMIN');
const requireManager = requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER');

module.exports = { authenticate, authenticatePortal, requireRole, requireSuperAdmin, requireAdmin, requireManager };
