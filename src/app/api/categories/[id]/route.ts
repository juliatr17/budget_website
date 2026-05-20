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

  const updated = await prisma.kategoria.update({
    where: { id_kategoria: idKategoria },
    data: {
      nazwa: parsed.data.nazwa,
      opis: parsed.data.opis || null,
      ikona: parsed.data.ikona || null,
      kolejnosc: parsed.data.kolejnosc,
    },
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

  await prisma.kategoria.update({
    where: { id_kategoria: idKategoria },
    data: { aktywna: false },
  });

  return apiOk({ message: "Kategoria zostala dezaktywowana" });
}
