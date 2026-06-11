import "dotenv/config";
import { PrismaClient, RolaSystemowa } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Brakuje DATABASE_URL w pliku .env");
  }

  // Ja tutaj tworze role systemowe, zeby od razu byly gotowe w bazie.
  await prisma.rola.createMany({
    data: [
      { nazwa: RolaSystemowa.GOSC },
      { nazwa: RolaSystemowa.UZYTKOWNIK },
      { nazwa: RolaSystemowa.ADMIN },
    ],
    skipDuplicates: true,
  });

  // Ja tutaj dodaje domyslne kategorie, ktore gosc moze przegladac.
  await prisma.kategoria.createMany({
    data: [
      { nazwa: "Jedzenie", opis: "Zakupy i restauracje", ikona: "utensils", kolejnosc: 1 },
      { nazwa: "Transport", opis: "Paliwo i bilety", ikona: "bus", kolejnosc: 2 },
      { nazwa: "Rozrywka", opis: "Kino, hobby, wyjscia", ikona: "party-popper", kolejnosc: 3 },
      { nazwa: "Wynagrodzenie", opis: "Pensja i premie", ikona: "banknote", kolejnosc: 4 },
      { nazwa: "Rachunki", opis: "Prad, internet, czynsz", ikona: "receipt", kolejnosc: 5 },
      { nazwa: "Zdrowie", opis: "Leki i wizyty lekarskie", ikona: "heart-pulse", kolejnosc: 6 },
      { nazwa: "Edukacja", opis: "Kursy, ksiazki, szkolenia", ikona: "book", kolejnosc: 7 },
      { nazwa: "Podroze", opis: "Bilety i noclegi", ikona: "plane", kolejnosc: 8 },
      { nazwa: "Oszczednosci", opis: "Odkładanie pieniedzy", ikona: "piggy-bank", kolejnosc: 9 },
      { nazwa: "Inwestycje", opis: "Akcje, ETF, lokaty", ikona: "chart-line", kolejnosc: 10 },
    ],
    skipDuplicates: true,
  });

  // Ja tutaj zakladam konto admina, zeby od razu dalo sie testowac panel.
  const hasloHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.uzytkownik.upsert({
    where: { email: "admin@budzet.local" },
    update: {},
    create: {
      login: "admin",
      email: "admin@budzet.local",
      imie: "Admin",
      nazwisko: "Systemowy",
      haslo_hash: hasloHash,
    },
  });

  const rolaAdmin = await prisma.rola.findUnique({
    where: { nazwa: RolaSystemowa.ADMIN },
  });

  if (rolaAdmin) {
    await prisma.uzytkownikRola.create({
      data: {
        id_uzytkownik: admin.id_uzytkownik,
        id_rola: rolaAdmin.id_rola,
      },
    }).catch(() => null);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
