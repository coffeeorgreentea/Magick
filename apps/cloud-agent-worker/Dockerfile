FROM node:18-alpine

ENV CLIENT_PLUGINS="github,rest,discord,twitter,loop,task,googleai,openai,search,bluesky,avatar,elevenlabs,database,anthropic,intent"
ENV SERVER_PLUGINS="github,rest,discord,twitter,loop,task,googleai,openai,search,bluesky,elevenlabs,database,anthropic,intent"

WORKDIR /app

# Only necessary runtime dependencies
RUN apk update \
    && apk add --no-cache

COPY package*.json ./
COPY scripts /app/scripts
COPY ./dist/apps/cloud-agent-worker /app/dist/apps/cloud-agent-worker

RUN npm ci --legacy-peer-deps --ignore-scripts

CMD [ "node", "/app/dist/apps/cloud-agent-worker/main.js" ]

