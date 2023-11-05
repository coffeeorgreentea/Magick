FROM node:18-alpine

ENV CLIENT_PLUGINS="github,rest,discord,twitter,loop,task,googleai,openai,search,bluesky,avatar,elevenlabs,database,anthropic,intent"
ENV SERVER_PLUGINS="github,rest,discord,twitter,loop,task,googleai,openai,search,bluesky,elevenlabs,database,anthropic,intent"

WORKDIR /app

RUN apk update \
    && apk add --no-cache

COPY package*.json ./
COPY scripts /app/scripts
COPY ./dist/apps/cloud-agent-manager /app/dist/apps/cloud-agent-manager

RUN npm ci --legacy-peer-deps --ignore-scripts

CMD [ "node", "/app/dist/apps/cloud-agent-manager/main.js" ]

