# Budget Website - Next.js + PostgreSQL

To jest projekt aplikacji do zarzadzania budzetem osobistym.  
Frontend i backend sa zrobione w jednym frameworku (Next.js), a dane sa trzymane w PostgreSQL przez Prisma.

## Co juz dziala

- rejestracja i logowanie,
- role: `GOSC`, `UZYTKOWNIK`, `ADMIN`,
- CRUD transakcji (dodawanie, lista, usuwanie logiczne, edycja przez API),
- filtrowanie transakcji po opisie
- endpointy administracyjne do podgladu uzytkownikow i zmiany roli.

## otwarcie

```bash
npm install
```
```bash
cp .env.example .env
```
```bash
npm run db:push
npm run db:seed
```
```bash
npm run dev
```
## Konto admina

- email: admin@budzet.local
- haslo: Admin123!

## Struktura

- `src/app` - strony i API routes,
- `src/components` - komponenty UI,
- `src/lib` - helpery (auth, prisma, walidacja),
- `prisma/schema.prisma` - model bazy danych.
