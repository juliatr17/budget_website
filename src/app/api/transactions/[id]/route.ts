import { Prisma } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !user.id || user.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const { id } = await params;
  const idTransakcja = Number(id);
  if (!Number.isInteger(idTransakcja)) {
    return apiError("Niepoprawne ID transakcji", 422);
  }

  const exists = await prisma.transakcja.findFirst({
    where: {
      id_transakcja: idTransakcja,
      id_uzytkownik: user.id,
      aktywny: true,
    },
  });

  if (!exists) {
    return apiError("Nie znaleziono transakcji", 404);
  }

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const updated = await prisma.transakcja.update({
    where: { id_transakcja: idTransakcja },
    data: {
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

  return apiOk(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !user.id || user.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const { id } = await params;
  const idTransakcja = Number(id);
  if (!Number.isInteger(idTransakcja)) {
    return apiError("Niepoprawne ID transakcji", 422);
  }

  const exists = await prisma.transakcja.findFirst({
    where: {
      id_transakcja: idTransakcja,
      id_uzytkownik: user.id,
      aktywny: true,
    },
  });

  if (!exists) {
    return apiError("Nie znaleziono transakcji", 404);
  }

  await prisma.transakcja.update({
    where: { id_transakcja: idTransakcja },
    data: { aktywny: false },
  });

  return apiOk({ message: "Transakcja zostala usunieta logicznie" });
}
