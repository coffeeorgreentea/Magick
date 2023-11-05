FROM node:18

WORKDIR /app

# Copy package.json, package-lock.json, and the built files
COPY package*.json ./
RUN npm install --only=production
COPY build/ build/

EXPOSE 3030

CMD ["node", "build/server.js"]
