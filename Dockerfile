FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-slim AS backend-builder
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/prisma ./prisma
RUN npx prisma generate

FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh nodejs
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/prisma ./prisma
COPY backend/src ./src
COPY --from=frontend-builder /frontend/dist ./public
RUN mkdir -p /app/uploads /app/logs && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 4000
ENV NODE_ENV=production
# Run migrations (best-effort) then seed, then start server
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || echo 'Migrations skipped'; node prisma/seed.js 2>&1 || echo 'Seed skipped'; node src/server.js"]
