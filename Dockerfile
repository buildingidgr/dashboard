# Use the official Node.js 18 image as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Generate package-lock.json if it doesn't exist and then run npm ci
RUN npm install --package-lock-only && npm ci

# Copy the rest of your app's source code
COPY . .

# Build your Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Run the app
CMD ["npm", "start"]

