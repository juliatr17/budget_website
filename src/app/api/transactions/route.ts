import { Prisma, TypTransakcji } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const text = searchParams.get("q");
  const typ = searchParams.get("typ");
  const idKategoria = searchParams.get("id_kategoria");

  const where: Prisma.TransakcjaWhereInput = {
    aktywny: true,
    id_uzytkownik: user.id,
  };

  // Ja buduje filtry warunkowo, zeby dało sie latwo szukac po wielu polach.
  if (from || to) {
    where.data_transakcji = {};
    if (from) where.data_transakcji.gte = new Date(from);
    if (to) where.data_transakcji.lte = new Date(to);
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

  const transactions = await prisma.transakcja.findMany({
    where,
    include: {
      kategoria: true,
    },
    orderBy: [{ data_transakcji: "desc" }, { id_transakcja: "desc" }],
  });

  const podsumowanie = transactions.reduce(
    (acc, item) => {
      const kwota = Number(item.kwota);
      if (item.typ === TypTransakcji.PRZYCHOD) {
        acc.przychody += kwota;
      } else {
        acc.wydatki += kwota;
      }
      acc.saldo = acc.przychody - acc.wydatki;
      return acc;
    },
    { przychody: 0, wydatki: 0, saldo: 0 },
  );

  return apiOk({ transactions, podsumowanie });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
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
