#!/bin/bash
set -e

echo "[start] Syncing database schema..."
npx prisma db push

echo "[start] Starting server..."
exec npx tsx server.ts
