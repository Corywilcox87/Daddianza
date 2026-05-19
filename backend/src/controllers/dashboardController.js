const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/apiResponse');

const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      accountCount,
      contactCount,
      catCount,
      leadCount,
      openOppCount,
      upcomingShows,
      recentEntries,
      tasksDue,
    ] = await Promise.all([
      prisma.account.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.cat.count({ where: { tenantId, isActive: true } }),
      prisma.lead.count({ where: { tenantId, status: { in: ['NEW', 'ASSIGNED', 'IN_PROCESS'] } } }),
      prisma.opportunity.count({
        where: { tenantId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      }),
      prisma.show.findMany({
        where: {
          tenantId,
          showDate: { gte: now },
          status: { in: ['UPCOMING', 'ENTRIES_OPEN'] },
        },
        take: 5,
        orderBy: { showDate: 'asc' },
        include: { _count: { select: { entries: true } } },
      }),
      prisma.showEntry.findMany({
        where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          cat: { select: { name: true, breed: true } },
          show: { select: { name: true, showDate: true } },
        },
      }),
      prisma.task.count({
        where: {
          tenantId,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lte: now },
        },
      }),
    ]);

    const oppValue = await prisma.opportunity.aggregate({
      where: { tenantId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      _sum: { amount: true },
    });

    return success(res, {
      counts: {
        accounts: accountCount,
        contacts: contactCount,
        cats: catCount,
        leads: leadCount,
        openOpportunities: openOppCount,
        tasksDue,
      },
      pipelineValue: oppValue._sum.amount || 0,
      upcomingShows,
      recentEntries,
    });
  } catch (err) {
    return error(res, 'Failed to fetch dashboard stats', 500);
  }
};

const getActivityStream = async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { tenantId: req.tenantId },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        account: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return success(res, activities);
  } catch (err) {
    return error(res, 'Failed to fetch activity stream', 500);
  }
};

module.exports = { getStats, getActivityStream };
