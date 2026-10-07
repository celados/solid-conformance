import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
(process.env.BUILD_MODE === "production" ? test.skip : test)(
  "Observe frames must report corrupt slot markers",
  async () => {
    const directory = resolve(".build", "finding020-" + process.pid);
    await build(directory, (process.env.BUILD_MODE ?? "observe") as BuildMode, {
      server: [],
      client: ["findings/020-observe-frame-corruption/client.ts"],
    });
    const server = Bun.serve({
      port: 0,
      fetch: (request) =>
        new URL(request.url).pathname.endsWith(".js")
          ? new Response(Bun.file(directory + new URL(request.url).pathname), {
              headers: { "content-type": "text/javascript" },
            })
          : new Response('<div id="root"></div><script type="module" src="/client.js"></script>', {
              headers: { "content-type": "text/html" },
            }),
    });
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(String(server.url));
      await page.waitForFunction(() => !!(window as any).result);
      const result = await page.evaluate(() => (window as any).result);
      expect(result.observed).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      for (const error of result.errors) {
        expect(error.kind).toBe("ssr");
        expect(error.severity).toBe("error");
        expect(error.data).toEqual({ slot: "children", end: "slot:children:end" });
      }
    } finally {
      await browser.close();
      server.stop(true);
      await rm(directory, { recursive: true, force: true });
    }
  },
  30000,
);
