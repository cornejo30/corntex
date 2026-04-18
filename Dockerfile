# Use a stable Node.js runtime as the base image
FROM node:20-slim

# Install system dependencies required for building native Node.js modules (like better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create and define the application directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
# Note: npm install will compile better-sqlite3 within this container environment
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Ensure the database file isn't overwritten if it exists in the image context
# (Though .dockerignore should handle this, we want to be explicit about volumes)
# If the db doesn't exist, our app's database.js will create it.

# Expose the application port
EXPOSE 3000

# Environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
