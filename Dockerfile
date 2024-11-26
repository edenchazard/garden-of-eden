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

# Required hacks for working animated banners in prod.
COPY resources/banner resources/banner
COPY workers/*.js workers/
COPY --from=build /src/node_modules/bullmq/dist/cjs dist/cjs 
COPY --from=build /src/node_modules/bullmq/package.json dist/package.json
RUN npm i sharp sharp-gif2 ofetch

CMD [ "node", ".output/server/index.mjs" ]

