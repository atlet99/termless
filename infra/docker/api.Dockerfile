FROM node:24-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/auth/package.json packages/auth/
COPY packages/worker/package.json packages/worker/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma/prisma.config.ts prisma/prisma.config.ts
RUN pnpm install --frozen-lockfile --filter=@termless/api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/worker/node_modules ./packages/worker/node_modules
COPY . .
ENV CI=true
RUN pnpm turbo run build --filter=@termless/api...

FROM node:24-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates tmux sudo util-linux curl git openssl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    -o /usr/local/bin/ttyd && chmod +x /usr/local/bin/ttyd

RUN npm install -g @anthropic-ai/claude-code \
    && curl -fsSL https://opencode.ai/install | bash

WORKDIR /app
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=build /app/packages/worker/node_modules ./packages/worker/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/auth/dist ./packages/auth/dist
COPY --from=build /app/packages/worker/dist ./packages/worker/dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/auth/package.json ./packages/auth/
COPY --from=build /app/packages/worker/package.json ./packages/worker/
COPY infra/docker/api-entrypoint.sh /app/entrypoint.sh

RUN mkdir -p /workspace

EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "apps/api/dist/index.js"]
