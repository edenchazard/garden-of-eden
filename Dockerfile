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

COPY --from=build /src/.output /src/.output
COPY resources/fonts /usr/share/fonts/

CMD [ "node", ".output/server/index.mjs" ]