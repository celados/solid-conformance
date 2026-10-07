import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const mode of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC10 live component first-only SSR and DOM adoption " + mode,
    async () => {
      const dir = resolve(
        ".build",
        "live-component-" + process.pid + "-" + mode,
      );
      await build(dir, mode, {
        client: ["tracks/frames/live-component/client.tsx"],
        server: ["tracks/frames/live-component/server.tsx"],
        serverComponents: true,
      });
      const m = await import(dir + "/server.js");
      const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        idleTimeout: 0,
        fetch: (request) =>
          new URL(request.url).pathname.startsWith("/_server")
            ? m.handle(request)
            : new URL(request.url).pathname.endsWith(".js")
              ? new Response(Bun.file(dir + new URL(request.url).pathname), {
                  headers: { "content-type": "text/javascript" },
                })
              : new URL(request.url).pathname === "/favicon.ico"
                ? new Response(null, { status: 204 })
                : new Response(m.document(request).readable, {
                    headers: { "content-type": "text/html" },
                  }),
      });
      const browser = await chromium.launch({
        channel: "chrome",
        headless: true,
      });
      try {
        const page = await browser.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (["error", "warning"].includes(m.type())) errors.push(m.text());
        });
        await page.goto(String(server.url), { waitUntil: "commit" });
        await page.waitForFunction(
          () => !!(window as any).liveComponent,
          null,
          { timeout: 2000 },
        );
        await page.waitForFunction(
          () =>
            (window as any).liveComponent.snapshot().statuses[0] ===
            "connected",
          null,
          { timeout: 5000 },
        );
        expect(
          await page.evaluate(() => (window as any).liveComponent.snapshot()),
        ).toMatchObject({ text: "17", adopted: true });
        expect(m.stats).toEqual({ calls: 2, opened: 2, closed: 1, cleaned: 1 });
        m.push(35);
        await page.waitForFunction(
          () => (window as any).liveComponent.snapshot().text === "35",
          null,
          { timeout: 2000 },
        );
        expect(errors).toEqual([]);
        await page.evaluate(() => (window as any).liveComponent.close());
        for (let i = 0; i < 100 && m.stats.closed < 2; i++)
          await new Promise((r) => setTimeout(r, 10));
        expect(m.stats).toEqual({ calls: 2, opened: 2, closed: 2, cleaned: 2 });
      } finally {
        m.push(99);
        await browser.close();
        server.stop(true);
        await rm(dir, { recursive: true, force: true });
      }
    },
    30000,
  );
