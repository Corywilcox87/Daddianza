const { PrismaClient } = require('@prisma/client');
const { success, error, notFound, paginated } = require('../utils/apiResponse');

const prisma = new PrismaClient();

// Super admin: list all tenants
const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, cats: true, shows: true } } },
      }),
      prisma.tenant.count(),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch tenants', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { users: true, cats: true, shows: true, showEntries: true } } },
    });
    if (!tenant) return notFound(res);
    return success(res, tenant);
  } catch (err) {
    return error(res, 'Failed to fetch tenant', 500);
  }
};

const update = async (req, res) => {
  try {
    const { stripeCustomerId, stripeSubscriptionId, ...safe } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: safe,
    });
    return success(res, tenant);
  } catch (err) {
    return error(res, 'Failed to update tenant', 500);
  }
};

// Any admin can update their own tenant settings
const updateOwn = async (req, res) => {
  try {
    const allowed = ['name', 'logoUrl', 'primaryColor', 'domain'];
    const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const tenant = await prisma.tenant.update({ where: { id: req.tenantId }, data });
    return success(res, tenant);
  } catch (err) {
    return error(res, 'Failed to update settings', 500);
  }
};

module.exports = { list, getOne, update, updateOwn };
