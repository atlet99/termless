FROM node@sha256:f22d6a1f082c02f292e86929b5b0442ac2e5eaf438a5dea9b1566601c3e05940 AS base # node:24.15.0
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter=@termless/dashboard...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo run build --filter=@termless/dashboard...

FROM node@sha256:f22d6a1f082c02f292e86929b5b0442ac2e5eaf438a5dea9b1566601c3e05940 AS runtime # node:24.15.0
WORKDIR /app
COPY --from=build /app/apps/dashboard/dist ./dist

RUN npm install -g serve

EXPOSE 3001
CMD ["serve", "-s", "dist", "-l", "3001"]
