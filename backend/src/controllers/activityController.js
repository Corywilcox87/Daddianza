const { PrismaClient } = require('@prisma/client');
const { success, created, error, notFound, paginated } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where = { tenantId: req.tenantId };

    if (req.query.type) where.type = req.query.type;
    if (req.query.accountId) where.accountId = req.query.accountId;
    if (req.query.contactId) where.contactId = req.query.contactId;

    const [data, total] = await Promise.all([
      prisma.activity.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          account: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return paginated(res, data, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch activities', 500);
  }
};

const create = async (req, res) => {
  try {
    const activity = await prisma.activity.create({
      data: { ...req.body, tenantId: req.tenantId, userId: req.user.id },
    });
    return created(res, activity);
  } catch (err) {
    return error(res, 'Failed to create activity', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data: req.body });
    return success(res, activity);
  } catch (err) {
    return error(res, 'Failed to update activity', 500);
  }
};

const remove = async (req, res) => {
  try {
    const existing = await prisma.activity.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.activity.delete({ where: { id: req.params.id } });
    return success(res, null, 'Activity deleted');
  } catch (err) {
    return error(res, 'Failed to delete activity', 500);
  }
};

const createNote = async (req, res) => {
  try {
    const note = await prisma.note.create({
      data: { ...req.body, tenantId: req.tenantId, userId: req.user.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    return created(res, note);
  } catch (err) {
    return error(res, 'Failed to create note', 500);
  }
};

const deleteNote = async (req, res) => {
  try {
    const existing = await prisma.note.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.note.delete({ where: { id: req.params.id } });
    return success(res, null, 'Note deleted');
  } catch (err) {
    return error(res, 'Failed to delete note', 500);
  }
};

module.exports = { list, create, update, remove, createNote, deleteNote };
