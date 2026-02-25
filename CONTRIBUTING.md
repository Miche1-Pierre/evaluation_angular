# 📝 Conventional Commits Guide

Ce projet utilise la spécification [Conventional Commits](https://www.conventionalcommits.org/) pour les messages de commit.

## 🎯 Pourquoi ?

- ✅ **Changelogs automatiques** - Génération automatique à chaque release
- ✅ **Versioning sémantique** - Détermination automatique de la version (major/minor/patch)
- ✅ **Historique clair** - Commits faciles à comprendre et à naviguer
- ✅ **Collaboration** - Standards cohérents pour toute l'équipe

## 📐 Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Type (obligatoire)

Le type indique la nature du changement :

| Type | Description | Impact version |
|------|-------------|----------------|
| `feat` | Nouvelle fonctionnalité | MINOR (0.X.0) |
| `fix` | Correction de bug | PATCH (0.0.X) |
| `docs` | Documentation uniquement | - |
| `style` | Formatage, lint (pas de changement de code) | - |
| `refactor` | Refactoring (ni feature ni fix) | - |
| `perf` | Amélioration de performance | PATCH (0.0.X) |
| `test` | Ajout ou correction de tests | - |
| `build` | Système de build (npm, webpack, etc.) | - |
| `ci` | CI/CD (GitHub Actions, etc.) | - |
| `chore` | Maintenance (mise à jour dépendances, etc.) | - |
| `revert` | Annulation d'un commit précédent | - |

### Scope (optionnel)

Le scope indique quelle partie du projet est affectée :

- `auth` - Authentification
- `api` - API backend
- `db` - Base de données
- `ui` - Interface utilisateur
- `docker` - Configuration Docker
- `ci` - CI/CD
- etc.

### Description (obligatoire)

- Utiliser l'impératif présent : "add" pas "added" ni "adds"
- Pas de majuscule au début
- Pas de point final
- Maximum 100 caractères

### Body (optionnel)

Explication détaillée des changements :
- Pourquoi le changement est nécessaire
- Quelle approche a été choisie
- Effets secondaires éventuels

### Footer (optionnel)

- `BREAKING CHANGE:` - Breaking change (augmente MAJOR version)
- `Closes #123` - Référence à une issue
- `Refs #456` - Lien vers une issue

## ✅ Exemples valides

### Features

```bash
feat(auth): add JWT authentication

Implement JSON Web Token authentication for API endpoints.
Tokens expire after 7 days by default.

Closes #42
```

```bash
feat(ui): add dark mode toggle
```

```bash
feat: add Docker support
```

### Fixes

```bash
fix(api): resolve CORS issue with frontend

The CORS middleware was not configured correctly,
preventing the frontend from making API calls.
```

```bash
fix(db): correct seed script port configuration
```

### Breaking Changes

```bash
feat!: redesign authentication system

BREAKING CHANGE: The authentication endpoint has changed from
/auth/login to /api/v2/auth/login. All clients must be updated.
```

Ou dans le footer :

```bash
feat(api): change response format

The API now returns data in a more structured format.

BREAKING CHANGE: Response structure has changed from { data } to { success, data, error }
```

### Documentation

```bash
docs: update README with Docker instructions
```

```bash
docs(api): add API endpoint documentation
```

### Autres

```bash
chore: update dependencies
```

```bash
ci: add automatic release workflow
```

```bash
refactor(auth): simplify token validation logic
```

```bash
perf(db): optimize product query with indexes
```

```bash
test(api): add integration tests for auth endpoints
```

## ❌ Exemples invalides

```bash
❌ Added new feature
❌ fix bug
❌ Update
❌ WIP
❌ Fix: typo in README
❌ feat(auth) add login
```

## 🔧 Conseils pratiques

### Commits atomiques

Chaque commit devrait représenter **une seule modification logique** :

```bash
✅ feat(auth): add login endpoint
✅ feat(auth): add logout endpoint
✅ test(auth): add tests for login endpoint

❌ feat(auth): add login, logout, and tests
```

### Rebase avant push

Pour garder un historique propre :

```bash
# Pendant le développement
git commit -m "wip: working on auth"
git commit -m "wip: still working"

# Avant de push
git rebase -i HEAD~2
# Squash et reformuler en un commit conventional
```

### Commit messages interactifs

Utilisez un template de commit :

```bash
# .gitmessage
# <type>(<scope>): <description>
#
# [optional body]
#
# [optional footer]
#
# Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
# Scope: auth, api, db, ui, docker, ci, etc.
#
# Breaking change: add ! after type or BREAKING CHANGE: in footer
```

Configurer :

```bash
git config commit.template .gitmessage
```

## 🤖 Automatisation

### Vérification automatique

Le workflow `.github/workflows/commit-lint.yml` vérifie automatiquement les commits dans les Pull Requests.

### Release automatique

Le workflow `.github/workflows/release.yml` :
1. Analyse les commits depuis la dernière release
2. Détermine le type de version (major/minor/patch)
3. Génère le changelog
4. Crée le tag et la release GitHub
5. Déclenche le build des images Docker

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)

## 🎓 Workflow de contribution

1. Créer une branche depuis `develop` :
   ```bash
   git checkout -b feat/new-feature develop
   ```

2. Faire des commits conventional :
   ```bash
   git commit -m "feat(auth): add password reset"
   git commit -m "test(auth): add tests for password reset"
   git commit -m "docs(auth): document password reset flow"
   ```

3. Push et créer une PR :
   ```bash
   git push origin feat/new-feature
   ```

4. Le CI vérifie les commits et les tests

5. Merge dans `develop` → tests automatiques

6. Merge de `develop` dans `main` → **release automatique** 🎉

---

**Note** : Les commits dans `main` déclenchent automatiquement une release si des commits `feat:` ou `fix:` sont détectés.
