import { apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  const login = searchParams.get("login")?.trim();

  let emailAvailable = true;
  let loginAvailable = true;

  if (email) {
    const emailExists = await prisma.uzytkownik.findUnique({
      where: { email },
      select: { id_uzytkownik: true },
    });
    emailAvailable = !emailExists;
  }

  if (login) {
    const loginExists = await prisma.uzytkownik.findUnique({
      where: { login },
      select: { id_uzytkownik: true },
    });
    loginAvailable = !loginExists;
  }

  return apiOk({ emailAvailable, loginAvailable });
}
