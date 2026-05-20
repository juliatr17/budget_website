import { RolaSystemowa } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { hashPassword, saveSessionToken, signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const { login, email, imie, nazwisko, password } = parsed.data;

  const exists = await prisma.uzytkownik.findFirst({
    where: {
      OR: [{ email }, { login }],
    },
  });

  if (exists) {
    return apiError("Konto z takim loginem lub emailem juz istnieje", 409);
  }

  const passwordHash = await hashPassword(password);

  const userRole = await prisma.rola.findUnique({
    where: { nazwa: RolaSystemowa.UZYTKOWNIK },
  });

  if (!userRole) {
    return apiError("Brak domyslnej roli w bazie", 500);
  }

  const created = await prisma.uzytkownik.create({
    data: {
      login,
      email,
      imie,
      nazwisko,
      haslo_hash: passwordHash,
      role_uzytkownika: {
        create: {
          id_rola: userRole.id_rola,
        },
      },
    },
  });

  // Ja od razu loguje nowego uzytkownika po rejestracji.
  const token = signToken({
    userId: created.id_uzytkownik,
    email: created.email,
    role: "UZYTKOWNIK",
  });
  await saveSessionToken(token);

  return apiOk(
    {
      id: created.id_uzytkownik,
      login: created.login,
      email: created.email,
    },
    201,
  );
}
