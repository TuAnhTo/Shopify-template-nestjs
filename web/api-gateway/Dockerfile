FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9 @nestjs/cli

COPY api-gateway/package*.json ./
COPY api-gateway/pnpm-lock.yaml* ./

RUN pnpm install --prod

# Copy source
COPY api-gateway/ .

# Build application
RUN nest build

# Expose port (check lại với main.ts)
EXPOSE 3003

# Run production mode
CMD ["pnpm", "start:prod"]