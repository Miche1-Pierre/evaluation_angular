# ============================================
# Pi & Rho's Games - Quick Start Script (PowerShell)
# ============================================

Write-Host "🎲 Pi & Rho's Games - Quick Start" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Docker est installé
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "❌ Docker n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    Write-Host "   https://docs.docker.com/get-docker/" -ForegroundColor Yellow
    exit 1
}

$dockerComposeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
if (-not $dockerComposeInstalled) {
    Write-Host "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord." -ForegroundColor Red
    Write-Host "   https://docs.docker.com/compose/install/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker et Docker Compose sont installés" -ForegroundColor Green
Write-Host ""

# Vérifier si .env existe
if (-not (Test-Path .env)) {
    Write-Host "📝 Création du fichier .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  N'oubliez pas de modifier .env avec vos propres valeurs !" -ForegroundColor Yellow
    Write-Host ""
}

# Demander si on veut build localement ou pull depuis GHCR
Write-Host "Comment voulez-vous démarrer ?" -ForegroundColor Cyan
Write-Host "1) Utiliser les images pré-buildées (recommandé)"
Write-Host "2) Builder localement"
$choice = Read-Host "Votre choix (1 ou 2)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Téléchargement des images depuis GitHub Container Registry..." -ForegroundColor Cyan
        docker-compose pull
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Impossible de télécharger les images. Elles sont peut-être privées." -ForegroundColor Yellow
            Write-Host "   Building locally instead..." -ForegroundColor Yellow
            docker-compose build
        }
    }
    "2" {
        Write-Host ""
        Write-Host "🔨 Build des images Docker..." -ForegroundColor Cyan
        docker-compose build
    }
    default {
        Write-Host "❌ Choix invalide. Abandon." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Démarrage des services..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "⏳ Attente du démarrage de la base de données..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📊 Initialisation de la base de données..." -ForegroundColor Cyan
docker-compose exec backend npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erreur lors de l'initialisation. Réessayez avec :" -ForegroundColor Yellow
    Write-Host "   docker-compose exec backend npm run db:seed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Tout est prêt !" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 Accès aux services :" -ForegroundColor White
Write-Host ""
Write-Host "  Frontend :  http://localhost:4200" -ForegroundColor Green
Write-Host "  Backend  :  http://localhost:3000" -ForegroundColor Green
Write-Host "  Database :  localhost:5432" -ForegroundColor Green
Write-Host ""
Write-Host "👥 Utilisateurs de test (password: password123) :" -ForegroundColor White
Write-Host "  - admin@dfs.com (Admin)" -ForegroundColor Yellow
Write-Host "  - alice@test.com (User)" -ForegroundColor Yellow
Write-Host "  - bob@test.com (User)" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Commandes utiles :" -ForegroundColor White
Write-Host "  docker-compose ps          - Voir le statut"
Write-Host "  docker-compose logs -f     - Voir les logs"
Write-Host "  docker-compose down        - Arrêter"
Write-Host "  docker-compose restart     - Redémarrer"
Write-Host ""
