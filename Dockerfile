FROM node:20-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci && npx playwright install --with-deps chromium

COPY . .
RUN npx prisma generate && next build

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx server.ts"]
