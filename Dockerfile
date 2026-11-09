FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
RUN groupadd --system --gid 1001 meet && useradd --system --uid 1001 --gid meet meet
COPY --from=builder --chown=meet:meet /app/.next/standalone ./
COPY --from=builder --chown=meet:meet /app/.next/static ./.next/static
COPY --from=builder --chown=meet:meet /app/public ./public
USER meet
EXPOSE 3000
CMD ["node", "server.js"]
