import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, signToken, verifyPassword, verifyToken } from "./auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-key-for-unit-tests-min-32-chars";
});

describe("logowanie - weryfikacja hasla", () => {
  it("akceptuje poprawne haslo i odrzuca bledne", async () => {
    const hash = await hashPassword("Admin123!");

    expect(await verifyPassword("Admin123!", hash)).toBe(true);
    expect(await verifyPassword("ZleHaslo1", hash)).toBe(false);
  });
});

describe("logowanie - token sesji", () => {
  it("tworzy token po zalogowaniu i pozwala go odczytac", () => {
    const token = signToken({
      userId: 1,
      email: "admin@budzet.local",
      role: "ADMIN",
    });

    const payload = verifyToken(token);

    expect(payload?.email).toBe("admin@budzet.local");
    expect(payload?.role).toBe("ADMIN");
  });
});
