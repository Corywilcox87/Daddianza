const { PrismaClient } = require('@prisma/client');
const { success, created, error, notFound, paginated } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId: req.tenantId };

    if (req.query.search) {
      where.OR = [
        { firstName: { contains: req.query.search, mode: 'insensitive' } },
        { lastName: { contains: req.query.search, mode: 'insensitive' } },
        { email: { contains: req.query.search, mode: 'insensitive' } },
        { cfaMemberId: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.accountId) where.accountId = req.query.accountId;

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { account: { select: { id: true, name: true } }, _count: { select: { cats: true } } },
      }),
      prisma.contact.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch contacts', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        account: true,
        cats: { take: 10 },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' } },
        showEntries: {
          take: 10,
          include: { show: { select: { id: true, name: true, showDate: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!contact) return notFound(res);
    return success(res, contact);
  } catch (err) {
    return error(res, 'Failed to fetch contact', 500);
  }
};

const create = async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      const exists = await prisma.contact.findFirst({ where: { email, tenantId: req.tenantId } });
      if (exists) return error(res, 'A contact with this email already exists');
    }
    const contact = await prisma.contact.create({ data: { ...req.body, tenantId: req.tenantId } });
    return created(res, contact);
  } catch (err) {
    return error(res, 'Failed to create contact', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.contact.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data: req.body });
    return success(res, contact);
  } catch (err) {
    return error(res, 'Failed to update contact', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.contact.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.contact.delete({ where: { id: req.params.id } });
    return success(res, null, 'Contact deleted');
  } catch (err) {
    return error(res, 'Failed to delete contact', 500);
  }
};

module.exports = { list, getOne, create, update, remove };
