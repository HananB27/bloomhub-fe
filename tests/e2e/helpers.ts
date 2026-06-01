import { expect, type Locator, type Page } from "@playwright/test";

const appBaseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const appCookieURL = new URL(appBaseURL);

export async function seedAuthCookies(
  page: Page,
  token: string,
  role: "employee" | "admin"
) {
  await page.context().addCookies([
    {
      name: "next-auth.session-token",
      value: token,
      domain: appCookieURL.hostname,
      path: "/",
      secure: appCookieURL.protocol === "https:",
    },
    {
      name: "token",
      value: token,
      domain: appCookieURL.hostname,
      path: "/",
      secure: appCookieURL.protocol === "https:",
    },
    {
      name: "auth_role",
      value: role,
      domain: appCookieURL.hostname,
      path: "/",
      secure: appCookieURL.protocol === "https:",
    },
  ]);
}

export async function gotoApp(page: Page) {
  await page.goto("/", { waitUntil: "commit" });
  await expect(
    page.locator('[data-testid="hr-dashboard-app"][data-hydrated="true"]')
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search modules...")).toBeVisible();
}

export async function openModule(page: Page, label: string) {
  const navButton = page
    .getByRole("navigation")
    .getByRole("button", { name: label, exact: true });
  await navButton.click();
  await expect(
    page.getByRole("heading", { name: label }).first()
  ).toBeVisible();
}

export async function openAssistant(page: Page) {
  await page.getByLabel("Open BloomAI assistant").click();
  await expect(page.getByRole("dialog", { name: /BloomAI/i })).toBeVisible();
}

export async function closeAssistant(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /BloomAI/i })).toBeHidden();
}

export async function expectToast(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible();
}

export async function pickSingleDate(
  page: Page,
  triggerLabel: string,
  day: string
) {
  const trigger = page.getByRole("button", { name: triggerLabel });
  await trigger.click();
  const popover = page.locator('[data-datepicker-popover="true"]');
  await expect(popover).toBeVisible();
  await popover.getByRole("button", { name: day, exact: true }).click();
  await expect(popover).toBeHidden();
}

export async function chooseSelectOption(
  page: Page,
  triggerLabel: string,
  optionText: string
) {
  await page.getByLabel(triggerLabel).click();
  await page.getByRole("option", { name: optionText, exact: true }).click();
}

export async function withinDialog(
  page: Page,
  name: string | RegExp
): Promise<Locator> {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function clickButton(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name }).click();
}
