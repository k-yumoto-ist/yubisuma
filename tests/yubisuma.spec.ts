import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /指スマ\s*ARENA/ })).toBeVisible({ timeout: 10_000 });
});

test("title to tutorial match and finish", async ({ page }) => {
  await page.getByRole("button", { name: /はじめて遊ぶ/ }).click();
  await expect(page.getByText("PLAYER", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "1", exact: true }).first().click();
  await page.getByRole("button", { name: /1\s*本/ }).click();
  await page.getByRole("button", { name: /指スマ！/ }).click();
  await expect(page.getByRole("button", { name: /次のラウンドへ/ })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("button", { name: /次のラウンドへ/ }).click();
  await page.getByRole("button", { name: "1", exact: true }).first().click();
  await page.getByRole("button", { name: /1\s*本/ }).click();
  await page.getByRole("button", { name: /指スマ！/ }).click();
  await expect(page.getByText("勝利！", { exact: true })).toBeVisible({ timeout: 5_000 });
});

test("quick mode reaches the arena screen", async ({ page }) => {
  await page.getByRole("button", { name: /対戦をはじめる/ }).click();
  await page.getByRole("button", { name: /クイック対戦/ }).click();
  await expect(page.getByText("RIVAL SELECT")).toBeVisible();
  await page.getByRole("button", { name: /この相手と対戦/ }).click();
  await expect(page.locator(".match-stage")).toBeVisible();
  await expect(page.locator(".match-focus .focus-turn")).toContainText("あなたの番");
  await expect(page.locator(".match-round strong")).toHaveText("01");
});

test("arena ladder starts the next battle", async ({ page }) => {
  await page.getByRole("button", { name: /対戦をはじめる/ }).click();
  await page.getByRole("button", { name: /アリーナモード/ }).click();
  await expect(page.getByText("ARENA LADDER")).toBeVisible();
  await page.getByRole("button", { name: /この階層へ/ }).click();
  await expect(page.locator(".match-stage")).toBeVisible();
  await expect(page.locator(".match-round strong")).toHaveText("01");
});

test("local mode asks for player names", async ({ page }) => {
  await page.getByRole("button", { name: /対戦をはじめる/ }).click();
  await page.getByRole("button", { name: /ローカル2人対戦/ }).click();
  await expect(page.getByText("LOCAL DUEL")).toBeVisible();
  await page.getByLabel("プレイヤー1の名前").fill("A");
  await page.getByLabel("プレイヤー2の名前").fill("B");
  await page.getByRole("button", { name: /対戦をはじめる/ }).click();
  await page.getByRole("button", { name: "1", exact: true }).first().click();
  await page.getByRole("button", { name: /1\s*本/ }).click();
  await page.getByRole("button", { name: /準備OK/ }).click();
  await page.getByRole("button", { name: /1\s*本/ }).click();
  await page.getByRole("button", { name: /いっせーの/ }).click();
  await expect(page.locator(".match-round strong")).toHaveText("02", { timeout: 6_000 });
});

test("settings are available from the title", async ({ page }) => {
  await page.getByRole("button", { name: "設定" }).click();
  await expect(page.getByText("SETTINGS")).toBeVisible();
  await page.getByRole("button", { name: /SFX/ }).click();
  await page.getByRole("button", { name: "BACK" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: /指スマ\s*ARENA/ })).toBeVisible({ timeout: 10_000 });
});
