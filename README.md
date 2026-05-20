# Budget Website - Next.js + PostgreSQL

To jest projekt aplikacji do zarzadzania budzetem osobistym.  
Frontend i backend sa zrobione w jednym frameworku (`Next.js App Router`), a dane sa trzymane w `PostgreSQL` przez `Prisma`.

## Co juz dziala

- rejestracja i logowanie na JWT (cookie httpOnly),
- role: `GOSC`, `UZYTKOWNIK`, `ADMIN`,
- CRUD transakcji (dodawanie, lista, usuwanie logiczne, edycja przez API),
- filtrowanie transakcji po opisie, dacie, typie i kategorii (API),
- katalog kategorii (publiczny odczyt, modyfikacja tylko admin),
- endpointy administracyjne do podgladu uzytkownikow i zmiany roli.

## Szybki start

1. Zainstaluj zaleznosci:

```bash
npm install
```

2. Skopiuj zmienne:

```bash
cp .env.example .env
```

3. Przygotuj baze danych (PostgreSQL musi dzialac lokalnie):

```bash
npm run db:push
npm run db:seed
```

4. Uruchom aplikacje:

```bash
npm run dev
```

## Konto testowe admina

- email: `admin@budzet.local`
- haslo: `Admin123!`

## Struktura

- `src/app` - strony i API routes,
- `src/components` - komponenty UI,
- `src/lib` - helpery (auth, prisma, walidacja),
- `prisma/schema.prisma` - model bazy danych.
