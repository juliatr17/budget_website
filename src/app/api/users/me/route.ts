import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validators";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.id || currentUser.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const user = await prisma.uzytkownik.findUnique({
    where: { id_uzytkownik: currentUser.id },
    select: {
      id_uzytkownik: true,
      login: true,
      email: true,
      imie: true,
      nazwisko: true,
      data_rejestracji: true,
      aktywny: true,
    },
  });

  if (!user) {
    return apiError("Nie znaleziono konta", 404);
  }

  return apiOk(user);
}

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.id || currentUser.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const exists = await prisma.uzytkownik.findFirst({
    where: {
      id_uzytkownik: { not: currentUser.id },
      OR: [{ login: parsed.data.login }, { email: parsed.data.email }],
    },
  });

  if (exists) {
    return apiError("Login lub email sa juz zajete", 409);
  }

  const updated = await prisma.uzytkownik.update({
    where: { id_uzytkownik: currentUser.id },
    data: parsed.data,
    select: {
      id_uzytkownik: true,
      login: true,
      email: true,
      imie: true,
      nazwisko: true,
      data_rejestracji: true,
    },
  });

  return apiOk(updated);
}
