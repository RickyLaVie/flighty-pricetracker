FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && next build

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx server.ts"]
