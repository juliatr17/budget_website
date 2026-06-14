#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "BLAD: brak DATABASE_URL w kontenerze app."
  echo "Uruchamiaj aplikacje przez: docker compose up --build"
  exit 1
fi

echo "Czekam na baze danych..."
until node -e "
const net = require('net');
const dbUrl = process.env.DATABASE_URL;
const match = dbUrl.match(/@([^:\/?#]+):(\d+)/);
if (!match) process.exit(1);
const host = match[1];
const port = Number(match[2]) || 5432;
const socket = net.createConnection({ host, port }, () => { socket.end(); process.exit(0); });
socket.on('error', () => process.exit(1));
"; do
  echo "Baza jeszcze nie gotowa, czekam 2 sekundy..."
  sleep 2
done

echo "Tworze tabele w bazie..."
npx prisma db push

echo "Seed bazy danych..."
node --import tsx prisma/seed.ts

echo "Start aplikacji..."
exec "$@"
