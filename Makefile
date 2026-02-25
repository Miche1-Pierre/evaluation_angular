# ============================================
# Makefile - Commandes Docker simplifiées
# ============================================

.PHONY: help dev prod build up down restart logs clean seed test

# Couleurs pour les messages
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
NC     := \033[0m # No Color

## help: Afficher cette aide
help:
	@echo "$(BLUE)Pi & Rho's Games - Docker Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Développement:$(NC)"
	@echo "  make dev           - Démarrer en mode développement (hot reload)"
	@echo "  make dev-logs      - Voir les logs en mode dev"
	@echo "  make dev-down      - Arrêter le mode dev"
	@echo ""
	@echo "$(GREEN)Production:$(NC)"
	@echo "  make prod          - Démarrer en mode production"
	@echo "  make build         - Builder les images"
	@echo "  make up            - Démarrer les services"
	@echo "  make down          - Arrêter les services"
	@echo "  make restart       - Redémarrer les services"
	@echo ""
	@echo "$(GREEN)Base de données:$(NC)"
	@echo "  make seed          - Initialiser et peupler la DB"
	@echo "  make db-init       - Initialiser la structure"
	@echo "  make db-reset      - Réinitialiser complètement la DB"
	@echo ""
	@echo "$(GREEN)Utilitaires:$(NC)"
	@echo "  make logs          - Voir tous les logs"
	@echo "  make logs-backend  - Logs du backend"
	@echo "  make logs-frontend - Logs du frontend"
	@echo "  make logs-db       - Logs de la DB"
	@echo "  make ps            - Statut des containers"
	@echo "  make clean         - Nettoyer tout (⚠️ supprime les données)"
	@echo "  make shell-backend - Shell dans le backend"
	@echo "  make shell-frontend - Shell dans le frontend"
	@echo "  make pull          - Télécharger les images depuis GHCR"

## dev: Démarrer en mode développement
dev:
	@echo "$(GREEN)🚀 Démarrage en mode développement...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Services démarrés !$(NC)"
	@echo ""
	@echo "Frontend: http://localhost:4200"
	@echo "Backend:  http://localhost:3000"
	@echo ""
	@echo "$(YELLOW)💡 Lancez 'make seed' pour initialiser la DB$(NC)"

## dev-logs: Logs en mode développement
dev-logs:
	@docker-compose -f docker-compose.dev.yml logs -f

## dev-down: Arrêter le mode développement
dev-down:
	@echo "$(YELLOW)Arrêt des services de développement...$(NC)"
	@docker-compose -f docker-compose.dev.yml down

## prod: Démarrer en mode production
prod: build up seed
	@echo "$(GREEN)✅ Application en production !$(NC)"
	@echo ""
	@echo "Frontend: http://localhost:4200"
	@echo "Backend:  http://localhost:3000"

## build: Builder les images Docker
build:
	@echo "$(BLUE)🔨 Build des images Docker...$(NC)"
	@docker-compose build

## up: Démarrer les services
up:
	@echo "$(GREEN)🚀 Démarrage des services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Services démarrés !$(NC)"

## down: Arrêter les services
down:
	@echo "$(YELLOW)⏹️  Arrêt des services...$(NC)"
	@docker-compose down

## restart: Redémarrer tous les services
restart:
	@echo "$(BLUE)🔄 Redémarrage des services...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✅ Services redémarrés !$(NC)"

## logs: Voir tous les logs
logs:
	@docker-compose logs -f

## logs-backend: Logs du backend uniquement
logs-backend:
	@docker-compose logs -f backend

## logs-frontend: Logs du frontend uniquement
logs-frontend:
	@docker-compose logs -f frontend

## logs-db: Logs de la base de données
logs-db:
	@docker-compose logs -f db

## ps: Statut des containers
ps:
	@docker-compose ps

## seed: Initialiser et peupler la base de données
seed:
	@echo "$(BLUE)📊 Initialisation de la base de données...$(NC)"
	@docker-compose exec backend npm run db:seed
	@echo "$(GREEN)✅ Base de données prête !$(NC)"

## db-init: Initialiser uniquement la structure
db-init:
	@echo "$(BLUE)🗄️  Initialisation de la structure...$(NC)"
	@docker-compose exec backend npm run db:init

## db-reset: Réinitialiser complètement la DB
db-reset:
	@echo "$(YELLOW)⚠️  Réinitialisation complète de la DB...$(NC)"
	@docker-compose exec backend npm run db:init
	@docker-compose exec backend npm run db:seed
	@echo "$(GREEN)✅ DB réinitialisée !$(NC)"

## clean: Nettoyer tout (containers, volumes, images)
clean:
	@echo "$(YELLOW)⚠️  Nettoyage complet...$(NC)"
	@docker-compose down -v
	@docker system prune -f
	@echo "$(GREEN)✅ Nettoyage terminé !$(NC)"

## shell-backend: Ouvrir un shell dans le backend
shell-backend:
	@docker-compose exec backend sh

## shell-frontend: Ouvrir un shell dans le frontend
shell-frontend:
	@docker-compose exec frontend sh

## pull: Télécharger les images depuis GitHub Container Registry
pull:
	@echo "$(BLUE)📦 Téléchargement des images...$(NC)"
	@docker-compose pull
	@echo "$(GREEN)✅ Images téléchargées !$(NC)"

## test: Lancer les tests (à implémenter)
test:
	@echo "$(YELLOW)Tests non encore implémentés$(NC)"
