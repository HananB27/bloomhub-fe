import { expect, test } from "@playwright/test";
import { createMockBackend } from "./mockBackend";
import { gotoApp, openModule, seedAuthCookies } from "./helpers";

test.describe("core module journeys", () => {
  test("vacations: validates empty submit, then creates a pending leave request", async ({
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

    await page.getByRole("button", { name: "Submit Request" }).click();
    await expect(page.getByText("Unable to submit request")).toBeVisible();
    await expect(
      page.getByText("Please fill in all required fields.")
    ).toBeVisible();

    await page.getByRole("button", { name: "Select leave type" }).click();
    await page.getByRole("option", { name: "Vacation", exact: true }).click();

    const pickers = page.getByRole("button", { name: "Pick a date" });
    await pickers.first().click();
    await page
      .locator('[data-datepicker-popover="true"]')
      .getByRole("button", { name: "15", exact: true })
      .click();
    await pickers.nth(1).click();
    await page
      .locator('[data-datepicker-popover="true"]')
      .getByRole("button", { name: "19", exact: true })
      .click();

    await page
      .getByPlaceholder("Please provide details...")
      .fill("Family trip to the coast");
    await page
      .getByRole("button", { name: "Select covering employee" })
      .click();
    await page
      .getByRole("option", { name: "Sarah Johnson", exact: true })
      .click();
    await page.getByRole("button", { name: "Submit Request" }).click();

    await expect
      .poll(() => backend.state.leaveRequests[0]?.reason, { timeout: 10_000 })
      .toBe("Family trip to the coast");
    await expect(page.getByText("Family trip to the coast")).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  });

  test("employee profiles: opens a profile, edits a tech tag, and saves it", async ({
    page,
  }) => {
    const backend = createMockBackend("employee");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "employee");

    await gotoApp(page);
    await openModule(page, "Employee Profiles");

    await page.getByPlaceholder("Search employees...").fill("John");
    await page
      .getByRole("button", { name: /Open profile for John Doe/i })
      .click();

    await expect(page.getByRole("heading", { name: "John Doe" })).toBeVisible();
    await page.getByRole("button", { name: /Edit profile/i }).click();
    await page.getByRole("button", { name: /Add Tag/i }).click();
    await page.getByPlaceholder("Search tags...").fill("Docker");
    await page.getByText("Docker", { exact: true }).click();
    await page.getByRole("button", { name: /Save changes/i }).click();

    await expect
      .poll(
        () =>
          backend.state.employees
            .find((emp) => emp.id === 1)
            ?.tech_tags?.some((tag: { name: string }) => tag.name === "Docker"),
        { timeout: 10_000 }
      )
      .toBe(true);
    await expect(page.getByText("Docker", { exact: true })).toBeVisible();
  });

  test("documents: opens a document drawer, requests signatures, and shows the pending workflow", async ({
    page,
  }) => {
    const backend = createMockBackend("admin");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "admin");

    await gotoApp(page);
    await openModule(page, "Documents");

    await expect(
      page.getByRole("heading", { name: "Documents" })
    ).toBeVisible();
    await page.getByText("Employment Agreement", { exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Employment Agreement" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Request signature" }).click();

    await expect(
      page.getByRole("dialog", { name: "Request signatures" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Add employee as signer" }).click();
    await page.getByPlaceholder("Search by name or email...").fill("John Doe");
    await page.getByText("John Doe", { exact: true }).click();
    await page.getByRole("button", { name: "Send request" }).click();

    await expect
      .poll(() => backend.state.documents[0]?.signature_status, {
        timeout: 10_000,
      })
      .toBe("pending");
    await expect
      .poll(() => backend.state.documents[0]?.version_count, {
        timeout: 10_000,
      })
      .toBe(3);
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
    await expect(page.getByText("Version history · 3")).toBeVisible();
  });
});
