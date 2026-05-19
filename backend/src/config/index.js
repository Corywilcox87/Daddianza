require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtPortalSecret: process.env.JWT_PORTAL_SECRET || 'change-this-portal-secret',
  bcryptRounds: 12,
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    plans: {
      STARTER: {
        priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
        price: 2900,
        name: 'Starter',
        maxUsers: 3,
        maxCats: 25,
      },
      PROFESSIONAL: {
        priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
        price: 7900,
        name: 'Professional',
        maxUsers: 15,
        maxCats: 200,
      },
      ENTERPRISE: {
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
        price: 19900,
        name: 'Enterprise',
        maxUsers: 999,
        maxCats: 9999,
      },
    },
  },
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  },
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'],
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@daddianza.com',
  },
};
