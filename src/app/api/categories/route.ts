import { RolaSystemowa } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const includeInactive = new URL(request.url).searchParams.get("include_inactive") === "1";

  // Ja pokazuje nieaktywne kategorie tylko adminowi, bo to jest panel zarzadzania.
  const canSeeInactive = includeInactive && user?.role === RolaSystemowa.ADMIN;
  const categories = await prisma.kategoria.findMany({
    where: canSeeInactive ? undefined : { aktywna: true },
    orderBy: [{ kolejnosc: "asc" }, { nazwa: "asc" }],
  });

  return apiOk(categories);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== RolaSystemowa.ADMIN) {
    return apiError("Tylko administrator moze dodawac kategorie", 403);
  }

  const body = await request.json();
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const created = await prisma.kategoria.create({
    data: {
      nazwa: parsed.data.nazwa,
      opis: parsed.data.opis || null,
      ikona: parsed.data.ikona || null,
      kolejnosc: parsed.data.kolejnosc,
    },
  });

  return apiOk(created, 201);
}
