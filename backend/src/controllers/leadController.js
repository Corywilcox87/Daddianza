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
        { company: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    if (req.query.status) where.status = req.query.status;
    if (req.query.assignedUserId) where.assignedUserId = req.query.assignedUserId;

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.lead.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch leads', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
        activities: { take: 5, orderBy: { createdAt: 'desc' } },
        notes: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!lead) return notFound(res);
    return success(res, lead);
  } catch (err) {
    return error(res, 'Failed to fetch lead', 500);
  }
};

const create = async (req, res) => {
  try {
    const lead = await prisma.lead.create({ data: { ...req.body, tenantId: req.tenantId } });
    return created(res, lead);
  } catch (err) {
    return error(res, 'Failed to create lead', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: req.body });
    return success(res, lead);
  } catch (err) {
    return error(res, 'Failed to update lead', 500);
  }
};

const convert = async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!lead) return notFound(res);
    if (lead.status === 'CONVERTED') return error(res, 'Lead already converted');

    const account = await prisma.account.create({
      data: {
        tenantId: req.tenantId,
        name: lead.company || `${lead.firstName} ${lead.lastName}`,
        type: 'EXHIBITOR',
        email: lead.email,
        phone: lead.phone,
      },
    });

    const contact = await prisma.contact.create({
      data: {
        tenantId: req.tenantId,
        accountId: account.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'CONVERTED', convertedAt: new Date(), accountId: account.id },
    });

    return success(res, { account, contact }, 'Lead converted successfully');
  } catch (err) {
    return error(res, 'Failed to convert lead', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.lead.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.lead.delete({ where: { id: req.params.id } });
    return success(res, null, 'Lead deleted');
  } catch (err) {
    return error(res, 'Failed to delete lead', 500);
  }
};

module.exports = { list, getOne, create, update, convert, remove };
