FROM node:22-alpine

WORKDIR /app

# Cài pnpm
RUN npm install -g pnpm@9 @nestjs/cli

COPY auth/package*.json ./
COPY auth/pnpm-lock.yaml* ./

RUN pnpm install

COPY auth/ .

# Expose port
EXPOSE 3002

CMD ["pnpm", "start:dev"]