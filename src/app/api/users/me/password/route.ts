import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.id || currentUser.role === "GOSC") {
    return apiError("Najpierw sie zaloguj", 401);
  }

  const body = await request.json();
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Niepoprawne dane", 422);
  }

  const user = await prisma.uzytkownik.findUnique({
    where: { id_uzytkownik: currentUser.id },
  });

  if (!user) {
    return apiError("Nie znaleziono konta", 404);
  }

  const isOldValid = await verifyPassword(parsed.data.oldPassword, user.haslo_hash);
  if (!isOldValid) {
    return apiError("Stare haslo jest niepoprawne", 401);
  }

  // Ja hashuje nowe haslo i dopiero wtedy zapisuje je do bazy.
  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.uzytkownik.update({
    where: { id_uzytkownik: user.id_uzytkownik },
    data: { haslo_hash: newHash },
  });

  return apiOk({ message: "Haslo zostalo zmienione" });
}
