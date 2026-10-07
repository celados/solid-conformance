import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { build, type BuildMode } from "../../scripts/build";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
const mode = (process.env.BUILD_MODE ?? "development") as BuildMode;
(mode === "production" ? test.skip : test)(
  "RFC08 L896: a rejection received before hydration has zero waitedMs",
  async () => {
    const dir = resolve(".build", "prearrived-" + process.pid);
    await build(dir, mode, {
      client: ["findings/054-prearrived-recovery-wait/client.tsx"],
      server: ["findings/054-prearrived-recovery-wait/server.tsx"],
    });
    const m = await import(dir + "/server.js");
    const html = await m.document();
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: (r) =>
        new URL(r.url).pathname.endsWith(".js")
          ? new Response(Bun.file(dir + new URL(r.url).pathname), {
              headers: { "content-type": "text/javascript" },
            })
          : new Response(html, { headers: { "content-type": "text/html" } }),
    });
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.goto(server.url.toString());
      await page.waitForFunction(
        () => (window as any).recoveryRepro?.records.length === 1,
      );
      expect(
        await page.evaluate(() => (window as any).recoveryRepro.wireParsed),
      ).toBe(true);
      expect(await page.locator("#root").textContent()).toBe("recovered");
      expect(
        await page.evaluate(() => (window as any).recoveryRepro.records),
      ).toHaveLength(1);
      expect(
        await page.evaluate(
          () => (window as any).recoveryRepro.records[0].waitedMs,
        ),
      ).toBe(0);
    } finally {
      await browser.close();
      server.stop(true);
      await rm(dir, { recursive: true, force: true });
    }
  },
  30000,
);
