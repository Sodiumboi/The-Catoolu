# ── Stage 1: Build the React app ──────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# Output is in /app/dist/

# ── Stage 2: Serve with Nginx ──────────────────────────────
FROM nginx:alpine

# Copy the built React files to Nginx's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom Nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx runs in foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]

ARG VITE_CREATION_ENGINE_ENABLED=false
ENV VITE_CREATION_ENGINE_ENABLED=$VITE_CREATION_ENGINE_ENABLED# cache bust Wed Jul 29 16:11:25 +07 2026
