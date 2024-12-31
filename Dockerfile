# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.16.0
ARG PORT=3000

FROM node:${NODE_VERSION}-slim AS base
ENV NODE_ENV=production
WORKDIR /src

# Cached layer for required node modules.
FROM base AS required-packages
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm i bullmq sharp --os=linux --cpu=x64

# Build
FROM base AS build
COPY --link package.json package-lock.json ./
RUN npm install --production=false
COPY --link . .
RUN npm run build
RUN npm prune

# Run
FROM base
ENV PORT=$PORT
# Required for health check.
RUN apt-get update && apt-get install curl -y
WORKDIR /src
# Required hacks for working animated banners in prod.
COPY --from=required-packages /src/node_modules/bullmq/dist/cjs dist/cjs 
COPY --from=required-packages /src/node_modules node_modules
COPY resources/banner resources/banner
COPY --from=build /src/.output .output 
COPY --from=build /src/workers/*.cjs workers/

CMD [ "node", ".output/server/index.mjs" ]

