# 🎲 Pi & Rho's Games - Evaluation Angular

Application web fullstack de jeu de devinettes de prix de produits, développée avec Angular, Node.js/Express et PostgreSQL.

![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

## 📋 Table des Matières

- [Démarrage Rapide avec Docker](#-démarrage-rapide-avec-docker)
- [Installation depuis les sources](#-installation-depuis-les-sources)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables d'Environnement](#-variables-denvironnement)
- [Contribution](#-contribution)

## 🚀 Démarrage Rapide avec Docker

### Option 1 : Utiliser les images pré-buildées depuis GitHub Container Registry

```bash
# Cloner le projet
git clone https://github.com/VOTRE_USERNAME/evaluation_angular.git
cd evaluation_angular

# Copier et configurer les variables d'environnement
cp .env.example .env

# Démarrer tous les services (utilise les images pré-buildées)
docker-compose pull
docker-compose up -d
```

### Option 2 : Builder les images localement

```bash
# Cloner le projet
git clone https://github.com/VOTRE_USERNAME/evaluation_angular.git
cd evaluation_angular

# Copier et configurer les variables d'environnement
cp .env.example .env

# Builder et démarrer tous les services
docker-compose up -d --build
```

### Accès aux services

- **Frontend** : http://localhost:4200
- **Backend API** : http://localhost:3000
- **PostgreSQL** : localhost:5432

### Initialiser la base de données

```bash
# Accéder au container backend
docker exec -it pirho-backend sh

# Lancer les seeders
npm run db:seed
```

Ou directement depuis votre machine :

```bash
# Avec docker-compose exec
docker-compose exec backend npm run db:seed
```

### Arrêter les services

```bash
# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## 💻 Installation depuis les sources

### Prérequis

- Node.js 22+
- PostgreSQL 16+
- npm ou yarn

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos paramètres PostgreSQL

# Initialiser la base de données
npm run db:init

# Peupler avec les données (themes + produits + utilisateurs de test)
npm run db:seed

# Lancer en mode développement
npm run dev

# Ou builder pour la production
npm run build
npm start
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer en mode développement
npm start

# Ou builder pour la production
npm run build
```

## ✨ Fonctionnalités

### Utilisateurs

- 🔐 Authentification (inscription/connexion)
- 👤 Profil utilisateur avec statistiques
- 🏆 Classement mondial des joueurs

### Jeu

- 🎮 Sessions de jeu avec 4 produits à deviner
- 💰 Système de scoring basé sur la précision
- 🎯 Difficulté ajustable (facile, moyen, difficile)
- 📊 Suivi des performances

### Social

- 👥 Système d'amis
- 💬 Demandes d'amitié
- 🎲 Sessions privées/publiques/amis uniquement
- 📧 Invitations à des sessions

### Produits

- 🛍️ ~200 produits réels (API DummyJSON)
- 🏷️ Catégories dynamiques (themes)
- 🖼️ Images et descriptions

## 🏗️ Architecture

```
evaluation_angular/
├── frontend/           # Application Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Services, guards, interceptors
│   │   │   ├── pages/         # Components de pages
│   │   │   └── shared/        # Composants partagés
│   │   └── assets/
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/            # API Node.js/Express
│   ├── src/
│   │   ├── routes/            # Routes API
│   │   ├── middleware/        # Middlewares
│   │   ├── config/            # Configuration
│   │   └── db/                # Scripts SQL
│   ├── scripts/               # Scripts de seeders
│   ├── Dockerfile
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── docker-publish.yml # CI/CD GitHub Actions
│
├── docker-compose.yml          # Orchestration Docker
└── README.md
```

## 🛠️ Technologies

### Frontend

- **Angular 19** - Framework frontend
- **TailwindCSS** - Styling
- **RxJS** - Programmation réactive
- **Nginx** - Serveur web (production)

### Backend

- **Node.js 22** - Runtime JavaScript
- **Express 5** - Framework web
- **TypeScript** - Langage
- **PostgreSQL 16** - Base de données
- **bcrypt** - Hashage de mots de passe
- **JWT** - Authentification

### DevOps

- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration
- **GitHub Actions** - CI/CD
- **GitHub Container Registry** - Registry d'images

## 📜 Scripts Disponibles

### Backend

```bash
npm run dev              # Mode développement
npm run build            # Build TypeScript
npm start                # Démarrer en production

# Base de données
npm run db:init          # Initialiser la structure
npm run db:seed:themes   # Peupler les themes
npm run db:seed:products # Peupler les produits
npm run db:seed:test     # Ajouter données de test
npm run db:seed          # Tout en une fois
```

### Frontend

```bash
npm start                # Mode développement (port 4200)
npm run build            # Build production
npm test                 # Tests unitaires
```

### Docker

```bash
docker-compose up -d     # Démarrer tous les services
docker-compose down      # Arrêter tous les services
docker-compose logs -f   # Voir les logs
docker-compose ps        # Statut des services
```

## 🔧 Variables d'Environnement

Créer un fichier `.env` à la racine :

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=angular
DB_PORT=5432

# Backend
BACKEND_PORT=3000
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_PORT=4200
CORS_ORIGIN=http://localhost:4200
```

## 👥 Utilisateurs de Test

Après avoir lancé `npm run db:seed`, vous pouvez vous connecter avec :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@dfs.com | password123 | Admin |
| alice@test.com | password123 | User |
| bob@test.com | password123 | User |
| charlie@test.com | password123 | User |
| diana@test.com | password123 | User |

## 🐳 Images Docker

Les images sont automatiquement buildées et publiées sur GitHub Container Registry à chaque push sur `main` :

```bash
# Pull des images
docker pull ghcr.io/VOTRE_USERNAME/evaluation_angular/frontend:latest
docker pull ghcr.io/VOTRE_USERNAME/evaluation_angular/backend:latest

# Utiliser avec docker-compose
docker-compose pull
docker-compose up -d
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

Développé avec ❤️ pour l'évaluation Angular

