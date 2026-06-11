import { Prisma, TypTransakcji } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";

function parseSummary(
  grouped: Array<{ typ: TypTransakcji; _sum: { kwota: Prisma.Decimal | null } }>,
) {
  let przychody = 0;
  let wydatki = 0;

  for (const item of grouped) {
    const amount = Number(item._sum.kwota ?? 0);
    if (item.typ === TypTransakcji.PRZYCHOD) {
      przychody += amount;
    } else {
      wydatki += amount;
    }
  }

  return {
    przychody,
    wydatki,
    saldo: przychody - wydatki,
  };
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function safePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

// Metoda GET: Pobiera przefiltrowana i podzielona na strony liste transakcji uzytkownika.
export async function GET(request: Request) {
  // 1. Sprawdzamy autoryzacje (czy uzytkownik jest zalogowany)
  const user = await getCurrentUser();
  if (!user || !user.id || user.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  // 2. Pobieramy parametry zapytania (query params) z adresu URL
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from"); // data od
  const to = searchParams.get("to");     // data do
  const text = searchParams.get("q");    // opis transakcji
  const typ = searchParams.get("typ");   // PRZYCHOD lub WYDATEK
  const idKategoria = searchParams.get("id_kategoria");
  const minKwota = searchParams.get("min_kwota");
  const maxKwota = searchParams.get("max_kwota");
  const page = safePositiveInt(searchParams.get("page"), 1); // numer strony
  const pageSize = Math.min(50, safePositiveInt(searchParams.get("page_size"), 3)); // ilosc rekordow na strone

  // 3. Budujemy obiekt warunkow zapytania dla bazy (where)
  const where: Prisma.TransakcjaWhereInput = {
    aktywny: true, // pobieramy tylko aktywne (nieusuniete)
    id_uzytkownik: user.id, // tylko transakcje zalogowanego uzytkownika
  };


  // filtruje warunkowo, zeby dało sie latwo szukac po wielu polach.
  if (from || to) {
    where.data_transakcji = {};
    if (from) where.data_transakcji.gte = new Date(from);
    if (to) where.data_transakcji.lte = endOfDay(new Date(to));
  }

  if (text) {
    where.opis = {
      contains: text,
      mode: "insensitive",
    };
  }

  if (typ && (typ === TypTransakcji.PRZYCHOD || typ === TypTransakcji.WYDATEK)) {
    where.typ = typ;
  }

  if (idKategoria) {
    const parsedId = Number(idKategoria);
    if (Number.isInteger(parsedId)) {
      where.id_kategoria = parsedId;
    }
  }

  if (minKwota || maxKwota) {
    where.kwota = {};
    if (minKwota && !Number.isNaN(Number(minKwota))) {
      where.kwota.gte = new Prisma.Decimal(minKwota);
    }
    if (maxKwota && !Number.isNaN(Number(maxKwota))) {
      where.kwota.lte = new Prisma.Decimal(maxKwota);
    }
  }

  // licze saldo calkowite osobno, zeby filtrowanie listy go nie zmienialo.
  const [transactions, totalCount, podsumowanieCalkowiteRaw, podsumowanieFiltrowaneRaw] = await Promise.all([
    prisma.transakcja.findMany({
      where,
      include: {
        kategoria: true,
      },
      orderBy: [{ data_transakcji: "desc" }, { id_transakcja: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transakcja.count({ where }),
    prisma.transakcja.groupBy({
      by: ["typ"],
      where: {
        aktywny: true,
        id_uzytkownik: user.id,
      },
      _sum: { kwota: true },
    }),
    prisma.transakcja.groupBy({
      by: ["typ"],
      where,
      _sum: { kwota: true },
    }),
  ]);

  const podsumowanieCalkowite = parseSummary(podsumowanieCalkowiteRaw);
  const podsumowanieFiltrowane = parseSummary(podsumowanieFiltrowaneRaw);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return apiOk({
    transactions,
    licznikFiltrowanych: totalCount,
    podsumowanieCalkowite,
    podsumowanieFiltrowane,
    page,
    pageSize,
    totalPages,
  });
}

// Metoda POST: Tworzy nowa transakcje w bazie danych.
export async function POST(request: Request) {
  // 1. Sprawdzamy autoryzacje
  const user = await getCurrentUser();
  if (!user || !user.id || user.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  // 2. Pobieramy i walidujemy dane przeslane w formacie JSON z przegladarki
  const body = await request.json();
  const parsed = transactionSchema.safeParse(body); // walidacja biblioteka Zod
  if (!parsed.success) {
    // Jesli dane sa niepoprawne (np. ujemna kwota), zwracamy blad walidacji 422
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  // 3. Zapisujemy nowa transakcje w bazie za pomoca Prisma
  const created = await prisma.transakcja.create({
    data: {
      id_uzytkownik: user.id, // przypisujemy transakcje do zalogowanego uzytkownika
      id_kategoria: parsed.data.id_kategoria,
      typ: parsed.data.typ, // PRZYCHOD lub WYDATEK
      kwota: new Prisma.Decimal(parsed.data.kwota), // zapisujemy kwote jako Decimal (dokladnosc walutowa)
      opis: parsed.data.opis || null,
      data_transakcji: parsed.data.data_transakcji,
    },
    include: {
      kategoria: true, // od razu dolaczamy dane kategorii, zeby zwrocic ja do frontu
    },
  });

  // 4. Zwracamy nowo utworzony obiekt transakcji z kodem sukcesu 201 (Created)
  return apiOk(created, 201);
}
