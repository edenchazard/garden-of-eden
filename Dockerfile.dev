# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.16.0

FROM node:${NODE_VERSION}-slim as base

ENV NODE_ENV=development

WORKDIR /src

# Build
FROM base as build

COPY --link package.json package-lock.json ./
RUN npm install

# Run
FROM base

COPY --from=build /src/node_modules /src/node_modules

CMD [ "npm", "run", "dev" ]
