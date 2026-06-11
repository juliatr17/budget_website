import { apiOk } from "@/lib/api-response";
import { saveSessionToken, signToken } from "@/lib/auth";

export async function POST() {
  const token = signToken({
    role: "GOSC",
    email: "gosc@lokalnie",
  });

  await saveSessionToken(token);
  return apiOk({ role: "GOSC", login: "Gosc" });
}
