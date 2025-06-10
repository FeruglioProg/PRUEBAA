FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client (if needed)
RUN npx prisma generate || true

# Build the application
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
