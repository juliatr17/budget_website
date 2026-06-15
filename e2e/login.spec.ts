import { expect, test } from "@playwright/test";

test("logowanie jako gosc", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Wejdz jako gosc" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Panel budzetu osobistego" }),
  ).toBeVisible();
});

test("logowanie admina", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("admin@budzet.local");
  await page.getByPlaceholder("Haslo").fill("Admin123!");
  await page.getByRole("button", { name: "Zaloguj" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Panel budzetu osobistego" }),
  ).toBeVisible();
});
