import { RolaSystemowa } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== RolaSystemowa.ADMIN) {
    return apiError("Tylko administrator moze edytowac kategorie", 403);
  }

  const { id } = await params;
  const idKategoria = Number(id);
  if (!Number.isInteger(idKategoria)) {
    return apiError("Niepoprawne ID kategorii", 422);
  }

  const body = await request.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const exists = await prisma.kategoria.findUnique({
    where: { id_kategoria: idKategoria },
  });
  if (!exists) {
    return apiError("Nie znaleziono kategorii", 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.kolejnosc > exists.kolejnosc) {
      await tx.kategoria.updateMany({
        where: {
          id_kategoria: { not: idKategoria },
          kolejnosc: {
            gt: exists.kolejnosc,
            lte: parsed.data.kolejnosc,
          },
        },
        data: {
          kolejnosc: { decrement: 1 },
        },
      });
    } else if (parsed.data.kolejnosc < exists.kolejnosc) {
      await tx.kategoria.updateMany({
        where: {
          id_kategoria: { not: idKategoria },
          kolejnosc: {
            gte: parsed.data.kolejnosc,
            lt: exists.kolejnosc,
          },
        },
        data: {
          kolejnosc: { increment: 1 },
        },
      });
    }

    return tx.kategoria.update({
      where: { id_kategoria: idKategoria },
      data: {
        nazwa: parsed.data.nazwa,
        opis: parsed.data.opis || null,
        ikona: parsed.data.ikona || null,
        kolejnosc: parsed.data.kolejnosc,
        aktywna: parsed.data.aktywna ?? exists.aktywna,
      },
    });
  });

  return apiOk(updated);
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== RolaSystemowa.ADMIN) {
    return apiError("Tylko administrator moze usuwac kategorie", 403);
  }

  const { id } = await params;
  const idKategoria = Number(id);
  if (!Number.isInteger(idKategoria)) {
    return apiError("Niepoprawne ID kategorii", 422);
  }

  // Ja robie usuniecie logiczne, czyli tylko dezaktywuje rekord.
  await prisma.kategoria.update({
    where: { id_kategoria: idKategoria },
    data: { aktywna: false },
  });

  return apiOk({ message: "Kategoria zostala dezaktywowana" });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== RolaSystemowa.ADMIN) {
    return apiError("Tylko administrator moze aktywowac kategorie", 403);
  }

  const { id } = await params;
  const idKategoria = Number(id);
  if (!Number.isInteger(idKategoria)) {
    return apiError("Niepoprawne ID kategorii", 422);
  }

  const body = (await request.json()) as { aktywna?: boolean };
  if (typeof body.aktywna !== "boolean") {
    return apiError("Podaj wartosc aktywna true/false", 422);
  }

  // Ja tutaj przywracam kategorie po dezaktywacji.
  const updated = await prisma.kategoria.update({
    where: { id_kategoria: idKategoria },
    data: { aktywna: body.aktywna },
  });

  return apiOk(updated);
}
