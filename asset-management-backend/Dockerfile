# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install dependencies cần thiết cho development + Docker CLI + postgresql-client (backup/restore)
RUN apk add --no-cache python3 make g++ docker-cli postgresql-client || \
    (sed -i 's/^#\(.*\/community\)/\1/' /etc/apk/repositories && apk update && apk add --no-cache docker-cli postgresql-client)

# Copy package files
COPY package*.json ./

# Install all dependencies (bao gồm devDependencies)
RUN npm ci

# Copy source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# postgresql-client cần cho backup/restore database (pg_dump, psql)
RUN apk add --no-cache postgresql-client

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts 2>/dev/null || npm ci --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist
# Cần cho sequelize-cli migrate/seed
COPY --from=builder /app/.sequelizerc ./
COPY --from=builder /app/sequelize-cli-config.js ./
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/seeders ./seeders
# Cần cho các script tiện ích (vd: npm run reset-admin)
COPY --from=builder /app/scripts ./scripts

EXPOSE 5000

CMD ["node", "dist/server.js"]
