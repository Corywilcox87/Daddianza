const { PrismaClient } = require('@prisma/client');
const { success, created, error, notFound, paginated, forbidden } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId: req.tenantId };

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { registrationNumber: { contains: req.query.search, mode: 'insensitive' } },
        { breed: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.breed) where.breed = req.query.breed;
    if (req.query.sex) where.sex = req.query.sex;
    if (req.query.contactId) where.contactId = req.query.contactId;
    if (req.query.accountId) where.accountId = req.query.accountId;
    if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

    const [data, total] = await Promise.all([
      prisma.cat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { showEntries: true } },
        },
      }),
      prisma.cat.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch cats', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const cat = await prisma.cat.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        account: true,
        contact: true,
        sire: { select: { id: true, name: true, breed: true, registrationNumber: true } },
        dam: { select: { id: true, name: true, breed: true, registrationNumber: true } },
        showEntries: {
          take: 10,
          include: { show: { select: { id: true, name: true, showDate: true, city: true, state: true } } },
          orderBy: { createdAt: 'desc' },
        },
        showResults: {
          take: 20,
          include: { show: { select: { id: true, name: true, showDate: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!cat) return notFound(res);
    return success(res, cat);
  } catch (err) {
    return error(res, 'Failed to fetch cat', 500);
  }
};

const create = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const catCount = await prisma.cat.count({ where: { tenantId: req.tenantId } });
    if (catCount >= tenant.maxCats) {
      return forbidden(res, `Cat limit reached (${tenant.maxCats}). Please upgrade your plan.`);
    }

    const cat = await prisma.cat.create({ data: { ...req.body, tenantId: req.tenantId } });
    return created(res, cat);
  } catch (err) {
    return error(res, 'Failed to create cat profile', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.cat.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    const cat = await prisma.cat.update({ where: { id: req.params.id }, data: req.body });
    return success(res, cat);
  } catch (err) {
    return error(res, 'Failed to update cat', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.cat.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.cat.delete({ where: { id: req.params.id } });
    return success(res, null, 'Cat profile deleted');
  } catch (err) {
    return error(res, 'Failed to delete cat', 500);
  }
};

const getShowHistory = async (req, res) => {
  try {
    const cat = await prisma.cat.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!cat) return notFound(res);

    const results = await prisma.showResult.findMany({
      where: { catId: req.params.id, tenantId: req.tenantId },
      include: { show: { select: { id: true, name: true, showDate: true, city: true, state: true } } },
      orderBy: { show: { showDate: 'desc' } },
    });

    const totalPoints = results.reduce((sum, r) => sum + (r.points || 0), 0);
    const finals = results.filter(r => r.isFinal);

    return success(res, { results, stats: { totalPoints, totalShows: results.length, finalsCount: finals.length } });
  } catch (err) {
    return error(res, 'Failed to fetch show history', 500);
  }
};

module.exports = { list, getOne, create, update, remove, getShowHistory };
