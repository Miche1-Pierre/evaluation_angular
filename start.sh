#!/bin/bash

# ============================================
# Pi & Rho's Games - Quick Start Script
# ============================================

set -e

echo "🎲 Pi & Rho's Games - Quick Start"
echo "=================================="
echo ""

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"
echo ""

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  N'oubliez pas de modifier .env avec vos propres valeurs !"
    echo ""
fi

# Demander si on veut build localement ou pull depuis GHCR
echo "Comment voulez-vous démarrer ?"
echo "1) Utiliser les images pré-buildées (recommandé)"
echo "2) Builder localement"
read -p "Votre choix (1 ou 2) : " choice

case $choice in
    1)
        echo ""
        echo "📦 Téléchargement des images depuis GitHub Container Registry..."
        docker-compose pull || {
            echo "⚠️  Impossible de télécharger les images. Elles sont peut-être privées."
            echo "   Trying to build locally instead..."
            docker-compose build
        }
        ;;
    2)
        echo ""
        echo "🔨 Build des images Docker..."
        docker-compose build
        ;;
    *)
        echo "❌ Choix invalide. Abandon."
        exit 1
        ;;
esac

echo ""
echo "🚀 Démarrage des services..."
docker-compose up -d

echo ""
echo "⏳ Attente du démarrage de la base de données..."
sleep 5

echo ""
echo "📊 Initialisation de la base de données..."
docker-compose exec -T backend npm run db:seed || {
    echo "⚠️  Erreur lors de l'initialisation. Réessayez avec :"
    echo "   docker-compose exec backend npm run db:seed"
}

echo ""
echo "✅ Tout est prêt !"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Accès aux services :"
echo ""
echo "  Frontend :  http://localhost:4200"
echo "  Backend  :  http://localhost:3000"
echo "  Database :  localhost:5432"
echo ""
echo "👥 Utilisateurs de test (password: password123) :"
echo "  - admin@dfs.com (Admin)"
echo "  - alice@test.com (User)"
echo "  - bob@test.com (User)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Commandes utiles :"
echo "  docker-compose ps          - Voir le statut"
echo "  docker-compose logs -f     - Voir les logs"
echo "  docker-compose down        - Arrêter"
echo "  docker-compose restart     - Redémarrer"
echo ""
