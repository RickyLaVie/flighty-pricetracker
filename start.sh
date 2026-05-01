#!/bin/bash
set -e

echo "[start] Running migrations..."
npx prisma migrate deploy

echo "[start] Starting server..."
exec npx tsx server.ts
