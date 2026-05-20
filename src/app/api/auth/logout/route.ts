import { apiOk } from "@/lib/api-response";
import { clearSessionToken } from "@/lib/auth";

export async function POST() {
  await clearSessionToken();
  return apiOk({ message: "Wylogowano" });
}
