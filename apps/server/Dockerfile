# Use the official Node.js 18 image as a parent image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json, package-lock.json (if available), and the necessary scripts for the postinstall
COPY package*.json ./

# Ensure the source directories and files are present
COPY apps/server/src ./apps/server/src
COPY scripts/ ./scripts/

# Install production dependencies, which will also trigger the postinstall script.
RUN npm install --only=production --legacy-peer-deps

# Copy the compiled/dist files to the working directory inside the container
# The path should be relative to the build context
COPY dist/apps/server/ ./

# If your app binds to a port, the EXPOSE instruction is used to have it mapped by the docker daemon
EXPOSE 3030

# Define the command to run your app using CMD which defines your runtime
# This should be just the file name as we are already in the WORKDIR (/app)
CMD ["node", "main.js"]
