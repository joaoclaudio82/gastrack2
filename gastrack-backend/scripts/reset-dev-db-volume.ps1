$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Atenção: isto remove o volume de dados do Postgres local (docker-compose.db.yml)."
docker compose -f docker-compose.db.yml down -v
Write-Host "Subindo Postgres de novo com credenciais do compose..."
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps
