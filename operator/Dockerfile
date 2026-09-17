# Gateway image. Build context is the repository root (see compose.yml),
# because Concorde is consumed from the vendored source until it reaches the
# npm registry: the image builds vendor/concorde and installs it as a file
# dependency.
FROM node:24-alpine

RUN apk add --no-cache docker-cli

WORKDIR /vendor/concorde
COPY vendor/concorde/package.json vendor/concorde/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY vendor/concorde/ ./
RUN npm run build

WORKDIR /app
COPY operator/package.json ./
RUN npm install --no-audit --no-fund --install-links=false \
  && rm -rf node_modules/@shutter-network/concorde \
  && ln -s /vendor/concorde node_modules/@shutter-network/concorde

COPY operator/main.ts operator/drizzle.config.ts operator/schema.ts ./
COPY operator/src ./src

CMD ["node", "main.ts"]
