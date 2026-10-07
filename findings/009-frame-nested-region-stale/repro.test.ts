import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from "../../tracks/frames/build";
test("A new server-function argument must replace nested server slot content", async () => {
  const directory = resolve(".build", "finding009-" + process.pid);
  await buildFrames(directory, (process.env.BUILD_MODE ?? "development") as any, {
    client: "findings/009-frame-nested-region-stale/client.tsx",
    server: "findings/009-frame-nested-region-stale/server.tsx",
  });
  const ssr = await import(directory + "/server.js");
  const server = Bun.serve({
    port: 0,
    fetch: (r) => {
      const u = new URL(r.url);
      if (u.pathname.startsWith("/_server")) return ssr.handle(r);
      if (u.pathname.endsWith(".js"))
        return new Response(Bun.file(directory + u.pathname), {
          headers: { "content-type": "text/javascript" },
        });
      return new Response('<div id="root"></div><script type="module" src="/client.js"></script>', {
        headers: { "content-type": "text/html" },
      });
    },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(String(server.url));
    await page.waitForFunction(() => document.querySelector("section")?.textContent === "1");
    await page.evaluate(() => (window as any).refetch());
    await page.waitForTimeout(300);
    await page.evaluate(() => (window as any).change());
    await page.waitForTimeout(300);
    expect(await page.locator("section").textContent()).toBe("2");
  } finally {
    await browser.close();
    server.stop(true);
    await rm(directory, { recursive: true, force: true });
  }
}, 30000);
