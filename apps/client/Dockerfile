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

# Copy your local 'dist' folder content to the image
COPY dist/apps/client ./client

# Nginx stage for serving static assets
FROM nginx:stable-alpine as production-stage

# Copy built assets from the build stage
COPY --from=build-stage /app/client /usr/share/nginx/html

# Remove the default nginx configuration file
RUN rm /etc/nginx/conf.d/default.conf

# Replace with a custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE is not actually required by Cloud Run but is a good documentation practice
EXPOSE 8080