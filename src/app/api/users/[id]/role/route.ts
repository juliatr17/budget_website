import { RolaSystemowa } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== RolaSystemowa.ADMIN) {
    return apiError("Tylko administrator moze zmieniac role", 403);
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) {
    return apiError("Niepoprawne ID uzytkownika", 422);
  }

  const body = await request.json();
  const rolaNazwa = body?.rola as RolaSystemowa | undefined;

  if (!rolaNazwa || !Object.values(RolaSystemowa).includes(rolaNazwa)) {
    return apiError("Niepoprawna rola", 422);
  }

  const rola = await prisma.rola.findUnique({ where: { nazwa: rolaNazwa } });
  if (!rola) {
    return apiError("Taka rola nie istnieje", 404);
  }

  // Ja zamykam stare role, bo chce miec jedna aktywna role na raz.
  await prisma.uzytkownikRola.updateMany({
    where: {
      id_uzytkownik: userId,
      data_odebrania: null,
    },
    data: {
      data_odebrania: new Date(),
      nadana_przez: currentUser.id,
    },
  });

  await prisma.uzytkownikRola.create({
    data: {
      id_uzytkownik: userId,
      id_rola: rola.id_rola,
      nadana_przez: currentUser.id,
    },
  });

  return apiOk({ message: "Rola zostala zmieniona" });
}
