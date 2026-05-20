FROM node@sha256:f22d6a1f082c02f292e86929b5b0442ac2e5eaf438a5dea9b1566601c3e05940 AS base # node:24.15.0
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/auth/package.json packages/auth/
COPY packages/worker/package.json packages/worker/
RUN pnpm install --frozen-lockfile --filter=@termless/api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo run build --filter=@termless/api...

FROM node@sha256:f22d6a1f082c02f292e86929b5b0442ac2e5eaf438a5dea9b1566601c3e05940 AS runtime # node:24.15.0
RUN apt-get update && apt-get install -y --no-install-recommends \
    tmux sudo util-linux curl git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 \
    -o /usr/local/bin/ttyd && chmod +x /usr/local/bin/ttyd

RUN npm install -g @anthropic-ai/claude-code \
    && curl -fsSL https://opencode.ai/install | bash

WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

RUN groupadd -g 1001 termless-api \
    && useradd -u 1001 -g termless-api -m termless-api

USER termless-api
EXPOSE 3000
CMD ["node", "dist/index.js"]
