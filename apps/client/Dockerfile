# Node stage for building static assets
FROM node:18-alpine as build-stage

ENV CLIENT_PLUGINS="github,rest,discord,twitter,loop,task,googleai,openai,search,bluesky,avatar,elevenlabs,database,anthropic,intent"
ENV SERVER_PLUGINS="github,rest,discord,twitter,loop,task,googleai,openai,search,bluesky,elevenlabs,database,anthropic,intent"

WORKDIR /app

# Only necessary runtime dependencies
RUN apk update \
    && apk add --no-cache make gcc g++ python3 \
    && ln -sf python3 /usr/bin/python \
    && python3 -m ensurepip \
    && pip3 install --no-cache --upgrade pip setuptools

COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts


# Assuming your local 'dist' folder is in the correct structure for your client app
COPY dist/apps/client ./client

# Nginx stage for serving static assets
FROM nginx:stable-alpine as production-stage

# Copy built assets from the build stage
COPY --from=build-stage /app/client /usr/share/nginx/html

EXPOSE 80
