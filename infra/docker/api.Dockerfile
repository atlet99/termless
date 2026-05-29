# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/auth/package.json packages/auth/
COPY packages/worker/package.json packages/worker/
RUN pnpm install --frozen-lockfile --filter=@termless/api...

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo run build --filter=@termless/api...

# ── Stage 3: Prisma generate ────────────────────────────────────────────────
FROM base AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma/ prisma/
RUN pnpm exec prisma generate

# ── Stage 4: Runtime ────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

RUN apk add --no-cache tmux sudo util-linux curl git bash

# Install ttyd
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then TTYD_ARCH="x86_64"; elif [ "$ARCH" = "aarch64" ]; then TTYD_ARCH="aarch64"; fi && \
    curl -sSL "https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.${TTYD_ARCH}" \
    -o /usr/local/bin/ttyd && chmod +x /usr/local/bin/ttyd

# Install opencode and claude code
RUN npm install -g @anthropic-ai/claude-code 2>/dev/null || true && \
    curl -fsSL https://opencode.ai/install | bash 2>/dev/null || true

WORKDIR /app

COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

RUN addgroup -g 1001 termless-api && \
    adduser -D -u 1001 -G termless-api termless-api && \
    mkdir -p /workspace && chown termless-api:termless-api /workspace

USER termless-api
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
