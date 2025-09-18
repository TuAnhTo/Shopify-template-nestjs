FROM node:22-alpine

WORKDIR /app

# Cài pnpm
RUN npm install -g pnpm@9 @nestjs/cli

COPY app/package*.json ./
COPY app/pnpm-lock.yaml* ./

RUN pnpm install

COPY app/ .

# Expose port
EXPOSE 3003

CMD ["pnpm", "start:dev"]