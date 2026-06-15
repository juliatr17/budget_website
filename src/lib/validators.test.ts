import { describe, expect, it } from "vitest";
import { loginSchema } from "./validators";

describe("loginSchema", () => {
  it("akceptuje poprawne dane logowania", () => {
    const result = loginSchema.safeParse({
      email: "admin@budzet.local",
      password: "Admin123!",
    });

    expect(result.success).toBe(true);
  });

  it("odrzuca niepoprawny email", () => {
    const result = loginSchema.safeParse({
      email: "to-nie-jest-email",
      password: "Admin123!",
    });

    expect(result.success).toBe(false);
  });
});
