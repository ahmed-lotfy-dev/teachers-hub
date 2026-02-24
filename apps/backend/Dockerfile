FROM oven/bun:1.3.5-alpine AS build

WORKDIR /app
COPY package.json ./
RUN bun install

COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle

RUN bun run build

FROM oven/bun:1.3.5-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY package.json ./
RUN bun install --production

COPY --from=build /app/dist ./dist

EXPOSE 8000
USER bun

CMD ["bun", "dist/index.js"]
