import { apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  return apiOk({ user });
}
