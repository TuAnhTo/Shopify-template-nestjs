FROM node:22-alpine

WORKDIR /app

# Cài pnpm
RUN npm install -g pnpm@9 @nestjs/cli

COPY app/package*.json ./
COPY app/pnpm-lock.yaml* ./

RUN pnpm install --prod

COPY app/ .

# Build application
RUN nest build

# Expose port
EXPOSE 3000

CMD ["pnpm", "start:prod"]