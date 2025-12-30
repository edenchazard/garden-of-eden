FROM node:24.11-bookworm-slim AS base
ENV NODE_ENV=production
WORKDIR /src
# Required for health check.
RUN apt-get update && apt-get install curl -y

# Cached layer for required node modules.
FROM base AS required-packages
COPY --link package.json package-lock.json ./
RUN npm i bullmq sharp --os=linux --cpu=x64

# Build
FROM required-packages AS build
ARG BASE_URL="/dc/hatchery"
ENV BASE_URL=$BASE_URL 
RUN npm i --production=false 
COPY --link . .
RUN npm run build

# Run
FROM base  
# Required hacks for working animated banners in prod. 
COPY --chown=node:node --from=required-packages /src/node_modules/bullmq/dist/cjs dist/cjs 
COPY --chown=node:node --from=required-packages /src/node_modules node_modules
COPY --chown=node:node resources/banner resources/banner
COPY --chown=node:node --from=build /src/.output .output 
COPY --chown=node:node --from=build /src/workers/*.cjs workers/

RUN mkdir /cache
RUN chown -R node:node /cache
USER node

CMD [ "node", ".output/server/index.mjs" ] 