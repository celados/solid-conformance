import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from "../../tracks/frames/build";
test("A connected live source must reconnect after a real TCP drop", async () => {
  const dir = resolve(".build", "finding014-" + process.pid);
  await buildFrames(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: "findings/014-live-drop-completes/client.ts",
    server: "findings/014-live-drop-completes/server.ts",
  });
  const ssr = await import(dir + "/server.js");
  const fetchHandler = (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/_server")) return ssr.handle(request);
    if (url.pathname.endsWith(".js"))
      return new Response(Bun.file(dir + url.pathname), {
        headers: { "content-type": "text/javascript" },
      });
    return new Response('<script type="module" src="/client.js"></script>', {
      headers: { "content-type": "text/html" },
    });
  };
  let server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: fetchHandler });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(String(server.url), { waitUntil: "commit" });
    await page.waitForFunction(() => (window as any).state?.values.length === 1, null, {
      timeout: 5000,
    });
    expect(ssr.stats.closed).toBe(0);
    const port = server.port;
    server.stop(true);
    server = Bun.serve({ port, hostname: "127.0.0.1", fetch: fetchHandler });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as any).state.status)).toContain("reconnecting");
  } finally {
    await browser.close();
    server.stop(true);
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
