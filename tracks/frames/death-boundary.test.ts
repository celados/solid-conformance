import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { build, type BuildMode } from "../../scripts/build";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
for (const mode of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC10 undeclared body death reaches nearest Errored and a buffering SSE proxy is silent until death " +
      mode,
    async () => {
      for (const buffer of [false, true]) {
        const dir = resolve(
          ".build",
          "body-death-" + process.pid + "-" + mode + "-" + buffer,
        );
        await build(dir, mode, {
          client: ["tracks/frames/death-boundary/client.tsx"],
          server: ["tracks/frames/death-boundary/server.ts"],
        });
        const m = await import(dir + "/server.js");
        const server = Bun.serve({
          hostname: "127.0.0.1",
          port: 0,
          idleTimeout: 0,
          fetch: (r) =>
            new URL(r.url).pathname.startsWith("/_server")
              ? m.handle(r)
              : new URL(r.url).pathname.endsWith(".js")
                ? new Response(Bun.file(dir + new URL(r.url).pathname), {
                    headers: { "content-type": "text/javascript" },
                  })
                : new Response(
                    '<div id="root"></div><script type="module" src="/client.js"></script>',
                    { headers: { "content-type": "text/html" } },
                  ),
        });
        const browser = await chromium.launch({
          channel: "chrome",
          headless: true,
        });
        try {
          const page = await browser.newPage();
          const errors: string[] = [];
          page.on("pageerror", (e) => errors.push(e.message));
          await page.goto(server.url + (buffer ? "?buffer" : ""));
          await page.waitForFunction(() => !!(window as any).deathBoundary);
          for (let i = 0; i < 100 && !m.stats.chunks; i++)
            await new Promise((r) => setTimeout(r, 10));
          expect(m.stats.chunks).toBeGreaterThan(0);
          if (buffer) expect(m.stats.buffered).toBeGreaterThan(0);
          await page.waitForTimeout(100);
          expect(
            await page.evaluate(() => (window as any).deathBoundary.snapshot()),
          ).toMatchObject({ text: "waiting", inner: 0, outer: 0 });
          m.drop();
          await page.waitForFunction(
            () => (window as any).deathBoundary.snapshot().text === "nearest",
            null,
            { timeout: 2000 },
          );
          expect(
            await page.evaluate(() => (window as any).deathBoundary.snapshot()),
          ).toMatchObject({ text: "nearest", inner: 1, outer: 0 });
          await page.waitForTimeout(100);
          expect(m.stats.calls).toBe(1);
          expect(errors).toEqual([]);
          await page.evaluate(() => (window as any).deathBoundary.dispose());
        } finally {
          m.close();
          await browser.close();
          server.stop(true);
          await rm(dir, { recursive: true, force: true });
        }
      }
    },
    30000,
  );
