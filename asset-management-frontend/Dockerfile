# Multi-stage Dockerfile cho Frontend
# Stage 1: Development
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Run dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Production Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for Vite env vars (passed at build time)
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build application
RUN npm run build

# Stage 3: Production Serve
FROM node:18-alpine AS production

# Serve static files with a small Node server
RUN npm i -g serve@14

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
