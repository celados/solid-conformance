import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
(process.env.BUILD_MODE === "production" ? test.skip : test)(
  "RFC08 recovery joins a boundary whose outcome is client",
  async () => {
    const dir = resolve(".build", "finding021-" + process.pid);
    await build(dir, (process.env.BUILD_MODE ?? "observe") as BuildMode, {
      client: ["findings/021-recovery-boundary-outcome/client.tsx"],
      server: ["findings/021-recovery-boundary-outcome/server.tsx"],
    });
    const ssr = await import(dir + "/server.js");
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const path = new URL(request.url).pathname;
        return path.endsWith(".js")
          ? new Response(Bun.file(dir + path), { headers: { "content-type": "text/javascript" } })
          : new Response(ssr.documentStream(100).readable, {
              headers: { "content-type": "text/html" },
            });
      },
    });
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(String(server.url), { waitUntil: "commit" });
      await page.waitForFunction(
        () =>
          document.querySelector("[data-recovered]")?.textContent === "recovered" &&
          (window as any).recovery.records.length === 1,
      );
      const recovery = await page.evaluate(() => (window as any).recovery.records[0].event);
      expect(ssr.records).toHaveLength(1);
      expect(recovery.id).toBe(ssr.records[0].event.id);
      expect(ssr.records[0].event.outcome).toBe("client");
    } finally {
      await browser.close();
      server.stop(true);
      await rm(dir, { recursive: true, force: true });
    }
  },
  30000,
);
