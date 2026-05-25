# Copyright 2026 Abdurakhman Rakhmankulov
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

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
