FROM node:20-alpine

WORKDIR /app

# Install OpenSSL 1.1 for Prisma compatibility
RUN apk add --no-cache openssl

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Generate Prisma Client after all files are copied
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
