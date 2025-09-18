FROM node:22-alpine

WORKDIR /app

# Cài pnpm
RUN npm install -g pnpm@9 @nestjs/cli

COPY webhook/package*.json ./
COPY webhook/pnpm-lock.yaml* ./

RUN pnpm install

COPY webhook/ .

# Expose port
EXPOSE 3005

CMD ["pnpm", "start:dev"]