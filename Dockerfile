FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker's build cache
COPY app/package.json app/package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./
COPY app ./

# Expose the port your application listens on
EXPOSE 3000

# Define the command to run when the container starts
CMD ["node", "server.js"]
