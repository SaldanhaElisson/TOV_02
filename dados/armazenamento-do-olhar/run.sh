#!/usr/bin/env bash
# Runs each database alone, with the same CPU/RAM limits, one format at a time.
set -euo pipefail
cd "$(dirname "$0")"
LIMITS=(--cpus=4 --memory=4g)

docker rm -f tov-bench-pg tov-bench-mongo >/dev/null 2>&1 || true

docker run -d --name tov-bench-pg "${LIMITS[@]}" -p 55432:5432 \
  -e POSTGRES_USER=bench -e POSTGRES_PASSWORD=bench -e POSTGRES_DB=bench \
  postgres:18.4 -c shared_buffers=1GB >/dev/null
until docker exec tov-bench-pg pg_isready -U bench -d bench >/dev/null 2>&1; do sleep 1; done
sleep 2
for f in rows array; do node scripts/postgres.mjs "$f"; done
docker rm -f -v tov-bench-pg >/dev/null

docker run -d --name tov-bench-mongo "${LIMITS[@]}" -p 57017:27017 mongo:8.3.13 --wiredTigerCacheSizeGB 1 >/dev/null
until docker exec tov-bench-mongo mongosh --quiet --eval 'db.runCommand({ping:1})' >/dev/null 2>&1; do sleep 1; done
for f in docs embedded; do node scripts/mongo.mjs "$f"; done
docker rm -f -v tov-bench-mongo >/dev/null
