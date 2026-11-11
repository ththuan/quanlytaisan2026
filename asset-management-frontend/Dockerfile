# Multi-stage Dockerfile cho Frontend
# Stage 1: Development
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4000

# Run dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Production Build
FROM node:20-alpine AS builder

WORKDIR /app

# Giới hạn heap khi build để tránh ăn hết RAM server (8GB) lúc deploy.
ENV NODE_OPTIONS=--max-old-space-size=2048

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 3: Production Serve (nginx đa worker, phục vụ static nhanh hơn Node)
FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
