# Backend - Evaluation Angular

Backend API Node.js/Express avec PostgreSQL et TypeScript.

## 🚀 Technologies

- **Node.js** + **Express** - Framework web
- **TypeScript** - Typage statique
- **PostgreSQL** - Base de données
- **pg** - Client PostgreSQL
- **dotenv** - Gestion des variables d'environnement
- **helmet** - Sécurité HTTP
- **cors** - Cross-Origin Resource Sharing
- **morgan** - Logger HTTP

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL (v14 ou supérieur)
- npm ou yarn

## 🔧 Installation

1. Installer les dépendances :
```bash
npm install
```

2. Copier le fichier `.env.example` vers `.env` et configurer vos variables :
```bash
cp .env.example .env
```

3. Modifier le fichier `.env` avec vos paramètres PostgreSQL :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evaluation_angular
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

4. Créer la base de données et les tables :
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, créer la base de données
CREATE DATABASE evaluation_angular;

# Quitter psql
\q

# Exécuter le script d'initialisation
npm run db:init
```

Ou manuellement :
```bash
psql -U postgres -d evaluation_angular -f src/db/init.sql
```

## 🏃 Démarrage

### Mode développement (avec hot reload)
```bash
npm run dev
```

### Mode production
```bash
# Compiler le TypeScript
npm run build

# Démarrer le serveur
npm start
```

## 📍 Endpoints

### Santé
- `GET /health` - Vérifier l'état du serveur

### Exemples
- `GET /api/examples` - Liste tous les exemples
- `GET /api/examples/:id` - Récupérer un exemple par ID
- `POST /api/examples` - Créer un nouvel exemple
- `PUT /api/examples/:id` - Mettre à jour un exemple
- `DELETE /api/examples/:id` - Supprimer un exemple

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # Configuration PostgreSQL
│   ├── db/
│   │   └── init.sql          # Script SQL d'initialisation
│   ├── routes/
│   │   ├── index.ts          # Router principal
│   │   └── example.routes.ts # Routes d'exemple
│   └── index.ts              # Point d'entrée de l'application
├── .env                      # Variables d'environnement (non versionné)
├── .env.example              # Template des variables
├── .gitignore
├── package.json
├── tsconfig.json             # Configuration TypeScript
└── README.md
```

## 🔐 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | 3000 |
| `NODE_ENV` | Environnement | development |
| `DB_HOST` | Hôte PostgreSQL | localhost |
| `DB_PORT` | Port PostgreSQL | 5432 |
| `DB_NAME` | Nom de la base | evaluation_angular |
| `DB_USER` | Utilisateur PostgreSQL | postgres |
| `DB_PASSWORD` | Mot de passe | postgres |
| `CORS_ORIGIN` | Origine CORS autorisée | http://localhost:4200 |

## 📝 Scripts disponibles

- `npm run dev` - Démarrer en mode développement avec tsx watch
- `npm run dev:nodemon` - Démarrer avec nodemon
- `npm run build` - Compiler le TypeScript en JavaScript
- `npm start` - Démarrer le serveur compilé
- `npm run db:init` - Initialiser la base de données

## 🐘 Configuration PostgreSQL

Assurez-vous que PostgreSQL est installé et en cours d'exécution :

```bash
# Vérifier le statut (Windows)
pg_ctl status

# Démarrer PostgreSQL (Windows)
pg_ctl start
```

## 🌐 CORS

Le serveur accepte les requêtes depuis `http://localhost:4200` par défaut (frontend Angular).
Modifiez `CORS_ORIGIN` dans `.env` selon vos besoins.

## 🔒 Sécurité

- **Helmet** : Headers de sécurité HTTP
- **CORS** : Contrôle des origines autorisées
- **Variables d'environnement** : Informations sensibles dans `.env`

## 📚 Prochaines étapes

- [ ] Ajouter l'authentification JWT
- [ ] Implémenter la validation des données (express-validator)
- [ ] Ajouter des tests (Jest)
- [ ] Mettre en place des migrations de base de données
- [ ] Ajouter la documentation API (Swagger)
