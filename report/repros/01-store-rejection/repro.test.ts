import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { build } from "./build";
test("Replacement derived-store rejection never reaches Errored", async () => {
  const dir = resolve("dist");
  await build(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: ["client.tsx"],
    server: [],
  });
  const server = Bun.serve({
    port: 0,
    fetch: (r) =>
      new URL(r.url).pathname === "/client.js"
        ? new Response(Bun.file(dir + "/client.js"), {
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
    expect(await page.evaluate(() => (window as any).result)).toBe("<b>error</b>");
  } finally {
    await browser.close();
    server.stop(true);
  }
}, 30000);
