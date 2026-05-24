#!/bin/bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspace}"
APP_ROOT="$(dirname "$(readlink -f "$0")")"
cd "$APP_ROOT"

ln -sf prisma/schema.prisma schema.prisma

echo "[entrypoint] Ensuring workspace root: ${WORKSPACE_ROOT}"
mkdir -p "${WORKSPACE_ROOT}"

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy || true

echo "[entrypoint] Running database seed..."
npx prisma db seed || true

echo "[entrypoint] Starting API server"
exec "$@"
