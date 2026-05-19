FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/prisma ./prisma
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
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
