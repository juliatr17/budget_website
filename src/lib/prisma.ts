// Ten plik odpowiada za utworzenie i udostepnienie jednego klienta bazy danych (PrismaClient) dla calej aplikacji.
import { PrismaClient } from "@prisma/client";

// Definiujemy obiekt globalny (globalThis), w ktorym bedzie przechowywana instancja PrismaClient.
// Dzieki temu Next.js nie bedzie tworzyl nowego polaczenia przy kazdym zapisaniu kodu.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Tworzymy nowa instancje PrismaClient tylko wtedy, gdy jeszcze nie istnieje w obiekcie globalnym.
// wzorzec projektowy "Singleton" (czyli zapewnienie istnienia tylko jednego obiektu danej klasy).
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // Logujemy do konsoli tylko powazne bledy i ostrzezenia.
  });

// Jesli nie jestesmy na produkcji (tylko w trybie developerskim), zapisujemy instancje do obiektu globalnego.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

