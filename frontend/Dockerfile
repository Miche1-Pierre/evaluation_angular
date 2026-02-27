# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY angular.json ./
COPY tsconfig*.json ./
COPY components.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY src/ ./src/
COPY public/ ./public/

# Build l'application Angular pour la production
RUN npm run build

# ============================================
# Stage 2: Production avec Nginx
# ============================================
FROM nginx:alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Exposer le port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
