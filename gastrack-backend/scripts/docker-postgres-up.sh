#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
echo "Subindo PostgreSQL (docker-compose.db.yml) em localhost:5432 ..."
docker compose -f docker-compose.db.yml up -d
docker compose -f docker-compose.db.yml ps
