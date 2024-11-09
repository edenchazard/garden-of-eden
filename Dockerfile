# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.16.0

FROM node:${NODE_VERSION}-slim as base

ARG PORT=3000

ENV NODE_ENV=production

WORKDIR /src

# Build
FROM base as build

COPY --link package.json package-lock.json ./
RUN npm install --production=false

COPY --link . .

RUN npm run build
RUN npm prune

# Run
FROM base
RUN apt-get update && apt-get install curl -y

ENV PORT=$PORT

WORKDIR /src
COPY --from=build /src/.output .output
COPY --from=build /src/package*.json . 
COPY resources/fonts /usr/share/fonts/
COPY resources/banner resources/banner
COPY workers/*.js workers/
RUN npm i sharp sharp-gif2
CMD [ "node", ".output/server/index.mjs" ]