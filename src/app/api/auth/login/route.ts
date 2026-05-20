import { apiError, apiOk } from "@/lib/api-response";
import { saveSessionToken, signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const { email, password } = parsed.data;

  const user = await prisma.uzytkownik.findUnique({
    where: { email },
    include: {
      role_uzytkownika: {
        where: { data_odebrania: null },
        include: { rola: true },
      },
    },
  });

  if (!user || !user.aktywny) {
    return apiError("Nie znaleziono aktywnego konta", 404);
  }

  const isValidPassword = await verifyPassword(password, user.haslo_hash);
  if (!isValidPassword) {
    return apiError("Bledne haslo", 401);
  }

  const role = user.role_uzytkownika[0]?.rola.nazwa ?? "GOSC";

  const token = signToken({
    userId: user.id_uzytkownik,
    email: user.email,
    role,
  });
  await saveSessionToken(token);

  return apiOk({
    id: user.id_uzytkownik,
    login: user.login,
    email: user.email,
    role,
  });
}
