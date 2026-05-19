const { PrismaClient } = require('@prisma/client');
const { success, error, notFound, paginated } = require('../utils/apiResponse');

const prisma = new PrismaClient();

// Portal: get authenticated exhibitor's own data
const getProfile = async (req, res) => {
  try {
    const portalUser = req.portalUser;
    return success(res, {
      id: portalUser.id,
      email: portalUser.email,
      firstName: portalUser.firstName,
      lastName: portalUser.lastName,
      contact: portalUser.contact,
      tenant: { id: portalUser.tenant.id, name: portalUser.tenant.name },
    });
  } catch (err) {
    return error(res, 'Failed to fetch profile', 500);
  }
};

const getMyCats = async (req, res) => {
  try {
    const contactId = req.portalUser.contactId;
    if (!contactId) return success(res, []);

    const cats = await prisma.cat.findMany({
      where: { contactId, tenantId: req.tenantId, isActive: true },
      include: { _count: { select: { showEntries: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, cats);
  } catch (err) {
    return error(res, 'Failed to fetch cats', 500);
  }
};

const getMyShowEntries = async (req, res) => {
  try {
    const contactId = req.portalUser.contactId;
    if (!contactId) return success(res, []);

    const entries = await prisma.showEntry.findMany({
      where: { contactId, tenantId: req.tenantId },
      include: {
        show: { select: { id: true, name: true, showDate: true, city: true, state: true, venue: true, status: true } },
        cat: { select: { id: true, name: true, breed: true, sex: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, entries);
  } catch (err) {
    return error(res, 'Failed to fetch show entries', 500);
  }
};

const getMyResults = async (req, res) => {
  try {
    const contactId = req.portalUser.contactId;
    if (!contactId) return success(res, []);

    const cats = await prisma.cat.findMany({
      where: { contactId, tenantId: req.tenantId },
      select: { id: true },
    });
    const catIds = cats.map(c => c.id);

    const results = await prisma.showResult.findMany({
      where: { catId: { in: catIds }, tenantId: req.tenantId },
      include: {
        show: { select: { id: true, name: true, showDate: true, city: true, state: true } },
        cat: { select: { id: true, name: true, breed: true } },
      },
      orderBy: { show: { showDate: 'desc' } },
    });
    return success(res, results);
  } catch (err) {
    return error(res, 'Failed to fetch results', 500);
  }
};

const getUpcomingShows = async (req, res) => {
  try {
    const shows = await prisma.show.findMany({
      where: {
        tenantId: req.tenantId,
        isPublic: true,
        showDate: { gte: new Date() },
        status: { in: ['UPCOMING', 'ENTRIES_OPEN'] },
      },
      include: {
        judges: true,
        _count: { select: { entries: true } },
      },
      orderBy: { showDate: 'asc' },
      take: 20,
    });
    return success(res, shows);
  } catch (err) {
    return error(res, 'Failed to fetch shows', 500);
  }
};

const submitEntry = async (req, res) => {
  try {
    const { showId, catId, specialRequests } = req.body;
    const contactId = req.portalUser.contactId;
    if (!contactId) return error(res, 'No contact linked to your portal account');

    const show = await prisma.show.findFirst({
      where: { id: showId, tenantId: req.tenantId, status: 'ENTRIES_OPEN' },
    });
    if (!show) return error(res, 'Show not found or entries are not open');

    if (show.entryDeadline && new Date() > show.entryDeadline) {
      return error(res, 'Entry deadline has passed');
    }

    const cat = await prisma.cat.findFirst({
      where: { id: catId, contactId, tenantId: req.tenantId },
    });
    if (!cat) return error(res, 'Cat not found or does not belong to you');

    const existing = await prisma.showEntry.findFirst({ where: { showId, catId } });
    if (existing) return error(res, 'This cat is already entered in this show');

    const entry = await prisma.showEntry.create({
      data: {
        tenantId: req.tenantId,
        showId,
        catId,
        contactId,
        entryFee: show.entryFee,
        specialRequests,
      },
      include: {
        show: { select: { id: true, name: true, showDate: true, city: true } },
        cat: { select: { id: true, name: true, breed: true } },
      },
    });
    return success(res, entry, 'Entry submitted successfully', 201);
  } catch (err) {
    return error(res, 'Failed to submit entry', 500);
  }
};

const withdrawEntry = async (req, res) => {
  try {
    const contactId = req.portalUser.contactId;
    const entry = await prisma.showEntry.findFirst({
      where: { id: req.params.entryId, contactId, tenantId: req.tenantId },
      include: { show: true },
    });
    if (!entry) return notFound(res, 'Entry not found');

    if (['IN_PROGRESS', 'COMPLETED'].includes(entry.show.status)) {
      return error(res, 'Cannot withdraw from a show that is in progress or completed');
    }

    await prisma.showEntry.delete({ where: { id: entry.id } });
    return success(res, null, 'Entry withdrawn');
  } catch (err) {
    return error(res, 'Failed to withdraw entry', 500);
  }
};

module.exports = { getProfile, getMyCats, getMyShowEntries, getMyResults, getUpcomingShows, submitEntry, withdrawEntry };
