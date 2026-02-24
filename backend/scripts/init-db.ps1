# Script PowerShell pour initialiser la base de données
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$sqlFile = "src/db/init.sql"

Write-Host "🔧 Initialisation de la base de données..." -ForegroundColor Cyan
Write-Host "📁 Fichier SQL: $sqlFile" -ForegroundColor Gray

& $psqlPath -U postgres -p 5433 -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de données initialisée avec succès!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de l'initialisation de la base de données" -ForegroundColor Red
    exit $LASTEXITCODE
}
