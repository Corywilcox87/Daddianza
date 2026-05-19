const { PrismaClient } = require('@prisma/client');
const { success, created, error, notFound, paginated } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = {};

    // Public shows are accessible cross-tenant; private shows are tenant-scoped
    if (req.query.public === 'true') {
      where.isPublic = true;
    } else if (req.tenantId) {
      where.tenantId = req.tenantId;
    }

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search, mode: 'insensitive' } },
        { city: { contains: req.query.search, mode: 'insensitive' } },
        { cfaShowNumber: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.status) where.status = req.query.status;
    if (req.query.state) where.state = req.query.state;
    if (req.query.year) {
      const year = parseInt(req.query.year);
      where.showDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    const [data, total] = await Promise.all([
      prisma.show.findMany({
        where,
        skip,
        take: limit,
        orderBy: { showDate: 'asc' },
        include: {
          judges: true,
          _count: { select: { entries: true } },
        },
      }),
      prisma.show.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch shows', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (!req.query.public) where.tenantId = req.tenantId;

    const show = await prisma.show.findFirst({
      where,
      include: {
        judges: true,
        entries: {
          include: {
            cat: {
              select: { id: true, name: true, breed: true, color: true, sex: true, registrationNumber: true, currentTitle: true },
            },
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { entryNumber: 'asc' },
        },
        _count: { select: { entries: true, results: true } },
      },
    });
    if (!show) return notFound(res);
    return success(res, show);
  } catch (err) {
    return error(res, 'Failed to fetch show', 500);
  }
};

const create = async (req, res) => {
  try {
    const { judges, ...showData } = req.body;
    const show = await prisma.show.create({
      data: {
        ...showData,
        tenantId: req.tenantId,
        judges: judges ? { create: judges } : undefined,
      },
      include: { judges: true },
    });
    return created(res, show);
  } catch (err) {
    return error(res, 'Failed to create show', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.show.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);

    const { judges, ...showData } = req.body;
    const show = await prisma.show.update({
      where: { id: req.params.id },
      data: {
        ...showData,
        judges: judges ? {
          deleteMany: {},
          create: judges,
        } : undefined,
      },
      include: { judges: true },
    });
    return success(res, show);
  } catch (err) {
    return error(res, 'Failed to update show', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.show.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.show.delete({ where: { id: req.params.id } });
    return success(res, null, 'Show deleted');
  } catch (err) {
    return error(res, 'Failed to delete show', 500);
  }
};

// Show entries
const listEntries = async (req, res) => {
  try {
    const entries = await prisma.showEntry.findMany({
      where: { showId: req.params.id, tenantId: req.tenantId },
      include: {
        cat: { select: { id: true, name: true, breed: true, sex: true, registrationNumber: true, currentTitle: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { entryNumber: 'asc' },
    });
    return success(res, entries);
  } catch (err) {
    return error(res, 'Failed to fetch entries', 500);
  }
};

const createEntry = async (req, res) => {
  try {
    const show = await prisma.show.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!show) return notFound(res, 'Show not found');

    const cat = await prisma.cat.findFirst({ where: { id: req.body.catId, tenantId: req.tenantId } });
    if (!cat) return notFound(res, 'Cat not found');

    const existing = await prisma.showEntry.findFirst({ where: { showId: req.params.id, catId: req.body.catId } });
    if (existing) return error(res, 'This cat is already entered in this show');

    const entry = await prisma.showEntry.create({
      data: { ...req.body, showId: req.params.id, tenantId: req.tenantId },
      include: { cat: true },
    });
    return created(res, entry);
  } catch (err) {
    return error(res, 'Failed to create entry', 500);
  }
};

const updateEntry = async (req, res) => {
  try {
    const entry = await prisma.showEntry.findFirst({
      where: { id: req.params.entryId, tenantId: req.tenantId },
    });
    if (!entry) return notFound(res);
    const updated = await prisma.showEntry.update({ where: { id: req.params.entryId }, data: req.body });
    return success(res, updated);
  } catch (err) {
    return error(res, 'Failed to update entry', 500);
  }
};

const deleteEntry = async (req, res) => {
  try {
    const entry = await prisma.showEntry.findFirst({
      where: { id: req.params.entryId, tenantId: req.tenantId },
    });
    if (!entry) return notFound(res);
    await prisma.showEntry.delete({ where: { id: req.params.entryId } });
    return success(res, null, 'Entry removed');
  } catch (err) {
    return error(res, 'Failed to delete entry', 500);
  }
};

// Show results
const listResults = async (req, res) => {
  try {
    const results = await prisma.showResult.findMany({
      where: { showId: req.params.id, tenantId: req.tenantId },
      include: {
        cat: { select: { id: true, name: true, breed: true, sex: true, currentTitle: true } },
      },
      orderBy: [{ ringNumber: 'asc' }, { placement: 'asc' }],
    });
    return success(res, results);
  } catch (err) {
    return error(res, 'Failed to fetch results', 500);
  }
};

const saveResult = async (req, res) => {
  try {
    const result = await prisma.showResult.create({
      data: { ...req.body, showId: req.params.id, tenantId: req.tenantId },
      include: { cat: { select: { id: true, name: true, breed: true } } },
    });
    return created(res, result);
  } catch (err) {
    return error(res, 'Failed to save result', 500);
  }
};

const getShowStats = async (req, res) => {
  try {
    const show = await prisma.show.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!show) return notFound(res);

    const [entryCount, resultCount, uniqueBreeds, paidCount] = await Promise.all([
      prisma.showEntry.count({ where: { showId: req.params.id } }),
      prisma.showResult.count({ where: { showId: req.params.id } }),
      prisma.showEntry.findMany({
        where: { showId: req.params.id },
        select: { cat: { select: { breed: true } } },
        distinct: ['catId'],
      }),
      prisma.showEntry.count({ where: { showId: req.params.id, isPaid: true } }),
    ]);

    const breeds = [...new Set(uniqueBreeds.map(e => e.cat.breed))];
    const totalRevenue = await prisma.showEntry.aggregate({
      where: { showId: req.params.id, isPaid: true },
      _sum: { entryFee: true },
    });

    return success(res, {
      entryCount,
      resultCount,
      uniqueBreedCount: breeds.length,
      breeds,
      paidCount,
      unpaidCount: entryCount - paidCount,
      totalRevenue: totalRevenue._sum.entryFee || 0,
    });
  } catch (err) {
    return error(res, 'Failed to fetch show stats', 500);
  }
};

module.exports = { list, getOne, create, update, remove, listEntries, createEntry, updateEntry, deleteEntry, listResults, saveResult, getShowStats };
