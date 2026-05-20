import { RolaSystemowa } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== RolaSystemowa.ADMIN) {
    return apiError("Tylko administrator moze przegladac uzytkownikow", 403);
  }

  const users = await prisma.uzytkownik.findMany({
    include: {
      role_uzytkownika: {
        where: { data_odebrania: null },
        include: { rola: true },
      },
    },
    orderBy: { data_rejestracji: "desc" },
  });

  return apiOk(users);
}
