FROM node:22-alpine

WORKDIR /app

# Cài pnpm
RUN npm install -g pnpm@9 @nestjs/cli

COPY shopify/package*.json ./
COPY shopify/pnpm-lock.yaml* ./

RUN pnpm install

COPY shopify/ .

# Expose port
EXPOSE 3004

CMD ["pnpm", "start:dev"]