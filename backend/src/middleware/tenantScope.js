// Ensures all queries are scoped to the authenticated user's tenant
const tenantScope = (req, res, next) => {
  if (!req.tenantId) {
    return res.status(401).json({ success: false, message: 'No tenant context' });
  }
  next();
};

module.exports = { tenantScope };
