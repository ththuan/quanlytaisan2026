# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install dependencies cần thiết cho development + Docker CLI (cho trang Quản trị hệ thống)
RUN apk add --no-cache python3 make g++ docker-cli || \
    (sed -i 's/^#\(.*\/community\)/\1/' /etc/apk/repositories && apk update && apk add --no-cache docker-cli)

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

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/server.js"]
