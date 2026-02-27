# ============================================
# Stage 1: Build
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:22-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev && npm cache clean --force

# Copier le build depuis le stage précédent
COPY --from=builder /app/dist ./dist

# Copier les scripts de la DB pour les seeders
COPY scripts/ ./scripts/
COPY src/db/ ./src/db/

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/example', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "dist/index.js"]
