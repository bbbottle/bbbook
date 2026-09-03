# syntax=docker/dockerfile:1
FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

# Native build tools for ssh2/cpu-features and openssh-client for runtime ssh config resolution
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ca-certificates \
       python3 \
       make \
       g++ \
       openssh-client \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/kindle-sdk/package.json ./packages/kindle-sdk/package.json
COPY packages/kindle-ui/package.json ./packages/kindle-ui/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

RUN pnpm install

COPY . .

RUN pnpm -r build

ENV API_PORT=80
ENV STORAGE_PATH=/storage/bbbook
EXPOSE 80

COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/main.js"]
