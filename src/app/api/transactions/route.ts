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

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.id || user.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const text = searchParams.get("q");
  const typ = searchParams.get("typ");
  const idKategoria = searchParams.get("id_kategoria");
  const minKwota = searchParams.get("min_kwota");
  const maxKwota = searchParams.get("max_kwota");

  const where: Prisma.TransakcjaWhereInput = {
    aktywny: true,
    id_uzytkownik: user.id,
  };

  // Ja buduje filtry warunkowo, zeby dało sie latwo szukac po wielu polach.
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

  const transactions = await prisma.transakcja.findMany({
    where,
    include: {
      kategoria: true,
    },
    orderBy: [{ data_transakcji: "desc" }, { id_transakcja: "desc" }],
  });

  // Ja licze saldo calkowite osobno, zeby filtrowanie listy go nie zmienialo.
  const [podsumowanieCalkowiteRaw, podsumowanieFiltrowaneRaw] = await Promise.all([
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

  return apiOk({
    transactions,
    licznikFiltrowanych: transactions.length,
    podsumowanieCalkowite,
    podsumowanieFiltrowane,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.id || user.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const created = await prisma.transakcja.create({
    data: {
      id_uzytkownik: user.id,
      id_kategoria: parsed.data.id_kategoria,
      typ: parsed.data.typ,
      kwota: new Prisma.Decimal(parsed.data.kwota),
      opis: parsed.data.opis || null,
      data_transakcji: parsed.data.data_transakcji,
    },
    include: {
      kategoria: true,
    },
  });

  return apiOk(created, 201);
}
