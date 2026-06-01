import { expect, test } from "@playwright/test";
import { createMockBackend } from "./mockBackend";
import {
  closeAssistant,
  expectToast,
  gotoApp,
  openAssistant,
  openModule,
  seedAuthCookies,
} from "./helpers";

test.describe("auth shell and AI", () => {
  test("lands on the dashboard shell with an authenticated session", async ({
    page,
  }) => {
    const backend = createMockBackend("employee");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "employee");

    await gotoApp(page);

    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
    await expect(
      page.getByText("Welcome back, John!", { exact: false })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search modules...")).toBeVisible();
  });

  test("searches modules, switches modules, chats with BloomAI, and closes the assistant", async ({
    page,
  }) => {
    const backend = createMockBackend("employee");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "employee");

    await gotoApp(page);

    await openModule(page, "Vacations");
    await expect(
      page.getByRole("heading", { name: "Vacations" })
    ).toBeVisible();

    await openAssistant(page);
    const prompt = page.getByPlaceholder("Ask BloomHub AI...");
    await prompt.fill("show my leave balance");
    await page.getByRole("button", { name: /^Send$/ }).click();

    await expect(
      page.getByText("I can help with leave requests.", { exact: false })
    ).toBeVisible();
    await expectToast(page, "I can help with leave requests.");

    await closeAssistant(page);
    await expect(page.getByRole("dialog", { name: /BloomAI/i })).toBeHidden();
  });
});
