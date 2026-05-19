const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { success, created, error, notFound, paginated, forbidden } = require('../utils/apiResponse');
const { bcryptRounds } = require('../config');

const prisma = new PrismaClient();

const list = async (req, res) => {
  try {
    const where = { tenantId: req.tenantId };
    if (req.query.search) {
      where.OR = [
        { firstName: { contains: req.query.search, mode: 'insensitive' } },
        { lastName: { contains: req.query.search, mode: 'insensitive' } },
        { email: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { firstName: 'asc' },
    });
    return success(res, users);
  } catch (err) {
    return error(res, 'Failed to fetch users', 500);
  }
};

const getOne = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, phone: true, avatarUrl: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) return notFound(res);
    return success(res, user);
  } catch (err) {
    return error(res, 'Failed to fetch user', 500);
  }
};

const create = async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.tenantId } });
    const userCount = await prisma.user.count({ where: { tenantId: req.tenantId, isActive: true } });
    if (userCount >= tenant.maxUsers) {
      return forbidden(res, `User limit reached (${tenant.maxUsers}). Please upgrade your plan.`);
    }

    const exists = await prisma.user.findFirst({ where: { email: req.body.email, tenantId: req.tenantId } });
    if (exists) return error(res, 'Email already registered');

    const passwordHash = await bcrypt.hash(req.body.password, bcryptRounds);
    const user = await prisma.user.create({
      data: { ...req.body, tenantId: req.tenantId, passwordHash, password: undefined },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    return created(res, user);
  } catch (err) {
    return error(res, 'Failed to create user', 500);
  }
};

const update = async (req, res) => {
  try {
    const existing = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);

    const { password, ...updateData } = req.body;
    if (password) updateData.passwordHash = await bcrypt.hash(password, bcryptRounds);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    return success(res, user);
  } catch (err) {
    return error(res, 'Failed to update user', 500);
  }
};

const remove = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return error(res, 'Cannot delete yourself');
    const existing = await prisma.user.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } });
    if (!existing) return notFound(res);
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'User deactivated');
  } catch (err) {
    return error(res, 'Failed to deactivate user', 500);
  }
};

// Portal users management
const listPortalUsers = async (req, res) => {
  try {
    const users = await prisma.portalUser.findMany({
      where: { tenantId: req.tenantId },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true, lastLoginAt: true, contactId: true },
      orderBy: { firstName: 'asc' },
    });
    return success(res, users);
  } catch (err) {
    return error(res, 'Failed to fetch portal users', 500);
  }
};

const createPortalUser = async (req, res) => {
  try {
    const exists = await prisma.portalUser.findFirst({ where: { email: req.body.email, tenantId: req.tenantId } });
    if (exists) return error(res, 'Portal user with this email already exists');

    const passwordHash = await bcrypt.hash(req.body.password, bcryptRounds);
    const user = await prisma.portalUser.create({
      data: { ...req.body, tenantId: req.tenantId, passwordHash, password: undefined },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true, contactId: true },
    });
    return created(res, user);
  } catch (err) {
    return error(res, 'Failed to create portal user', 500);
  }
};

module.exports = { list, getOne, create, update, remove, listPortalUsers, createPortalUser };
