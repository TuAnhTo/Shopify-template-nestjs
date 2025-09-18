FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY api-gateway/package*.json ./
COPY api-gateway/pnpm-lock.yaml* ./

RUN pnpm install

# Copy source
COPY api-gateway/ .

# Expose port (check lại với main.ts)
EXPOSE 3001

# Run dev mode
CMD ["pnpm", "start:dev"]