# Use the official Node.js 18 image as a parent image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy the compiled/dist files to the working directory inside the container
# The path should be relative to the build context
COPY dist/apps/server/ ./

# If your app binds to a port, the EXPOSE instruction is used to have it mapped by the docker daemon
EXPOSE 3030

# Define the command to run your app using CMD which defines your runtime
# This should be just the file name as we are already in the WORKDIR (/app)
CMD ["node", "main.js"]
