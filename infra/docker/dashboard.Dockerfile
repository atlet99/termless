FROM node:26-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared/package.json packages/shared/
COPY prisma/schema.prisma prisma/schema.prisma
RUN pnpm install --frozen-lockfile --filter=@termless/dashboard...

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV CI=true
RUN pnpm turbo run build --filter=@termless/dashboard...

FROM node:26-slim AS runtime
WORKDIR /app
COPY --from=build /app/apps/dashboard/dist ./dist

RUN npm install -g serve

EXPOSE 3001
CMD ["serve", "-s", "dist", "-l", "3001"]
