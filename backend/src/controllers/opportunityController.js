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
      where.name = { contains: req.query.search, mode: 'insensitive' };
    }
    if (req.query.stage) where.stage = req.query.stage;
    if (req.query.accountId) where.accountId = req.query.accountId;

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          account: { select: { id: true, name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch opportunities', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const opp = await prisma.opportunity.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        account: true,
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!opp) return notFound(res);
    return success(res, opp);
  } catch (err) {
    return error(res, 'Failed to fetch opportunity', 500);
  }
};

const create = async (req, res) => {
  try {
    const opp = await prisma.opportunity.create({ data: { ...req.body, tenantId: req.tenantId } });
    return created(res, opp);
  } catch (err) {
    return error(res, 'Failed to create opportunity', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.opportunity.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    const opp = await prisma.opportunity.update({ where: { id: req.params.id }, data: req.body });
    return success(res, opp);
  } catch (err) {
    return error(res, 'Failed to update opportunity', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.opportunity.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    return success(res, null, 'Opportunity deleted');
  } catch (err) {
    return error(res, 'Failed to delete opportunity', 500);
  }
};

const getPipeline = async (req, res) => {
  try {
    const stages = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'DECISION_MAKERS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
    const pipeline = await Promise.all(
      stages.map(async (stage) => {
        const [count, aggregate] = await Promise.all([
          prisma.opportunity.count({ where: { tenantId: req.tenantId, stage } }),
          prisma.opportunity.aggregate({ where: { tenantId: req.tenantId, stage }, _sum: { amount: true } }),
        ]);
        return { stage, count, totalValue: aggregate._sum.amount || 0 };
      })
    );
    return success(res, pipeline);
  } catch (err) {
    return error(res, 'Failed to fetch pipeline', 500);
  }
};

module.exports = { list, getOne, create, update, remove, getPipeline };
