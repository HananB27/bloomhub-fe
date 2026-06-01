import { expect, test } from "@playwright/test";
import { createMockBackend } from "./mockBackend";
import { gotoApp, openModule, seedAuthCookies } from "./helpers";

test.describe("module operation journeys", () => {
  test("assets: assigns an asset, verifies status details, and downloads QR code", async ({
    page,
  }) => {
    const backend = createMockBackend("admin");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "admin");

    await gotoApp(page);
    await openModule(page, "Asset Management");

    await page.getByRole("button", { name: "Assign Asset" }).first().click();
    await page.getByLabel("Employee").click();
    await page.getByRole("option", { name: "John Doe", exact: true }).click();
    await page.getByRole("button", { name: "Assign Asset" }).last().click();

    await expect
      .poll(() => backend.state.assets[0]?.assigned_employee_name, {
        timeout: 10_000,
      })
      .toBe("John Doe");
    await expect(page.getByText("John Doe", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "View" }).first().click();
    const assetDialog = page.getByRole("dialog", { name: "MacBook Pro 14" });
    await expect(assetDialog).toBeVisible();
    await expect(
      assetDialog.getByText("John Doe", { exact: true })
    ).toBeVisible();
    await expect(
      assetDialog.getByText("assigned", { exact: true })
    ).toBeVisible();

    const download = page.waitForEvent("download");
    await assetDialog.getByRole("button", { name: "Download QR" }).click();
    const qrDownload = await download;
    expect(qrDownload.suggestedFilename()).toContain("MacBook-Pro-14-401-qr");
  });

  test("training: adds an entry, then finds it through search and type filters", async ({
    page,
  }) => {
    const backend = createMockBackend("employee");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "employee");

    await gotoApp(page);
    await openModule(page, "Training & Development");

    await page.getByRole("button", { name: "Add Training" }).click();
    const form = page.getByRole("dialog", { name: "Add Training Entry" });
    await expect(form).toBeVisible();

    await form.getByLabel(/Course Title/i).fill("Playwright onboarding");
    await form.getByLabel(/Provider/i).fill("BloomHub Academy");
    await form.getByRole("button", { name: "Course" }).click();
    const datePicker = form
      .getByRole("button", { name: "Pick a date" })
      .first();
    await datePicker.click();
    await page
      .locator('[data-datepicker-popover="true"]')
      .getByRole("button", { name: "12", exact: true })
      .click();
    await form.getByLabel("Notes").fill("Automation rollout");
    await form.getByRole("button", { name: "Add Entry" }).click();

    await expect
      .poll(() => backend.state.trainingEntries[0]?.course_title, {
        timeout: 10_000,
      })
      .toBe("Playwright onboarding");
    await expect(
      page.getByText("Playwright onboarding", { exact: true })
    ).toBeVisible();

    const filters = page.getByPlaceholder(
      "Search by title, provider, employee…"
    );
    await filters.fill("Playwright");
    await expect(
      page.getByText("Playwright onboarding", { exact: true })
    ).toBeVisible();

    await page
      .locator("select")
      .filter({ hasText: "All types" })
      .first()
      .selectOption("course");
    await expect(
      page.getByText("Playwright onboarding", { exact: true })
    ).toBeVisible();
  });

  test("compensation: logs a bonus and finds it in the bonus history", async ({
    page,
  }) => {
    const backend = createMockBackend("admin");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "admin");

    await gotoApp(page);
    await openModule(page, "Compensation");

    await page.getByRole("button", { name: "Log bonus" }).click();
    const dialog = page.getByRole("dialog", { name: "Log bonus" });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Employee").click();
    await page.getByRole("option", { name: /Sarah Johnson/i }).click();
    await dialog.getByLabel("Type").click();
    await page.getByRole("option", { name: "Retention", exact: true }).click();
    await dialog.getByLabel("Amount (BAM)").fill("750");
    await dialog.getByPlaceholder("Pick a date").click();
    await page
      .locator('[data-datepicker-popover="true"]')
      .getByRole("button", { name: "1", exact: true })
      .click();
    await dialog
      .getByLabel("Reason")
      .fill("Retention bonus for migration work");
    await dialog.getByRole("button", { name: "Log bonus" }).click();

    await expect
      .poll(() => backend.state.bonuses[0]?.reason, { timeout: 10_000 })
      .toBe("Retention bonus for migration work");

    await page.getByRole("tab", { name: "Bonus & Incentives" }).click();
    await page.getByLabel("Search").fill("Retention bonus");
    await expect(
      page.getByText("Retention bonus for migration work", { exact: true })
    ).toBeVisible();
  });

  test("projects: creates a project, assigns a member, and updates project status", async ({
    page,
  }) => {
    const backend = createMockBackend("admin");
    await backend.install(page);
    await seedAuthCookies(page, backend.state.session.accessToken, "admin");

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "bh.projects.defaults",
        JSON.stringify({
          default_status: "active",
          default_project_type: "internal",
          default_app_stack: "Next.js, TypeScript",
          require_lead: false,
        })
      );
    });

    await gotoApp(page);
    await openModule(page, "Projects");

    await page.getByRole("button", { name: "New project" }).click();
    const drawer = page.getByRole("dialog", { name: /Create a project/i });
    await expect(drawer).toBeVisible();

    await drawer.getByLabel(/Project name/i).fill("Atlas Migration");
    await drawer.getByRole("button", { name: "Next" }).click();
    const timelinePicker = drawer
      .getByRole("button", { name: "Pick a date" })
      .first();
    await timelinePicker.click();
    await page
      .locator('[data-datepicker-popover="true"]')
      .getByRole("button", { name: "15", exact: true })
      .click();
    await drawer.getByRole("button", { name: "Next" }).click();
    await drawer.getByRole("button", { name: "Next" }).click();
    await drawer.getByRole("button", { name: "Create project" }).click();

    await expect
      .poll(() => backend.state.projects[0]?.name, { timeout: 10_000 })
      .toBe("Atlas Migration");
    await expect(
      page.getByRole("button", { name: /Open Atlas Migration/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /Open Atlas Migration/i }).click();
    await expect(
      page.getByRole("heading", { name: "Atlas Migration" })
    ).toBeVisible();

    await page.getByRole("tab", { name: "Members · 0" }).click();
    await page.getByRole("button", { name: "Assign employee" }).click();
    const memberDialog = page.getByRole("dialog", {
      name: /Assign employee to Atlas Migration/i,
    });
    await expect(memberDialog).toBeVisible();
    await memberDialog.getByLabel("Employee").click();
    await page
      .getByRole("option", { name: "Sarah Johnson", exact: true })
      .click();
    await memberDialog.getByRole("button", { name: "Assign employee" }).click();

    await expect
      .poll(
        () =>
          backend.state.projectAssignments[backend.state.projects[0].id]?.[0]
            ?.employee_name,
        { timeout: 10_000 }
      )
      .toBe("Sarah Johnson");
    await expect(
      page.getByText("Sarah Johnson", { exact: true })
    ).toBeVisible();

    await page.getByRole("tab", { name: "Overview" }).click();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const statusDialog = page.getByRole("dialog", { name: /Update status/i });
    await expect(statusDialog).toBeVisible();
    await statusDialog.getByLabel("Status").click();
    await page.getByRole("option", { name: "On hold", exact: true }).click();
    await statusDialog.getByLabel("Stage").click();
    await page.getByRole("option", { name: "Delivery", exact: true }).click();
    await statusDialog.getByLabel("Note (optional)").fill("Moved to QA hold");
    await statusDialog.getByRole("button", { name: "Save status" }).click();

    await expect
      .poll(() => backend.state.projects[0]?.status, { timeout: 10_000 })
      .toBe("On hold");
    await expect(page.getByText("On hold", { exact: true })).toBeVisible();
  });

  test("admin gate: blocks non-admin users and allows admin users into a loaded tab", async ({
    page,
  }) => {
    const employeeBackend = createMockBackend("employee");
    await employeeBackend.install(page);
    await seedAuthCookies(
      page,
      employeeBackend.state.session.accessToken,
      "employee"
    );

    await gotoApp(page);
    await expect(page.getByRole("button", { name: "Admin Panel" })).toHaveCount(
      0
    );

    const adminPage = await page.context().newPage();
    const adminBackend = createMockBackend("admin");
    await adminBackend.install(adminPage);
    await seedAuthCookies(
      adminPage,
      adminBackend.state.session.accessToken,
      "admin"
    );

    await adminPage.goto("/");
    await openModule(adminPage, "Admin Panel");
    await expect(
      adminPage.getByRole("heading", { name: "Admin Panel" })
    ).toBeVisible();
    await adminPage.getByRole("tab", { name: "Roles & Permissions" }).click();
    await expect(
      adminPage.getByText("Permissions", { exact: true })
    ).toBeVisible();
  });
});
