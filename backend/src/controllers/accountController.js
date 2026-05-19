const { PrismaClient } = require('@prisma/client');
const { success, created, error, notFound, paginated } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const buildWhere = (tenantId, query) => {
  const where = { tenantId };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.type) where.type = query.type;
  return where;
};

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = buildWhere(req.tenantId, req.query);

    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { contacts: true, cats: true } } },
      }),
      prisma.account.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch accounts', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        contacts: { take: 10 },
        cats: { take: 10 },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' } },
        _count: { select: { contacts: true, cats: true, showEntries: true } },
      },
    });
    if (!account) return notFound(res);
    return success(res, account);
  } catch (err) {
    return error(res, 'Failed to fetch account', 500);
  }
};

const create = async (req, res) => {
  try {
    const account = await prisma.account.create({
      data: { ...req.body, tenantId: req.tenantId },
    });
    return created(res, account);
  } catch (err) {
    return error(res, 'Failed to create account', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.account.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    const account = await prisma.account.update({ where: { id: req.params.id }, data: req.body });
    return success(res, account);
  } catch (err) {
    return error(res, 'Failed to update account', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.account.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.account.delete({ where: { id: req.params.id } });
    return success(res, null, 'Account deleted');
  } catch (err) {
    return error(res, 'Failed to delete account', 500);
  }
};

module.exports = { list, getOne, create, update, remove };
