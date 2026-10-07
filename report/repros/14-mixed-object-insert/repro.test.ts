import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build } from "./build";
// 08-dev-diagnostics.md L692: plain objects at insert positions are skipped.
test("unrenderable object is skipped when adjacent to text, as in a sole hole", async () => {
  const dir = resolve(".build", "mixed-object-" + process.pid);
  await build(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: ["./client.tsx"],
    server: [],
  });
  const server = Bun.serve({
    port: 0,
    fetch: (r) =>
      new URL(r.url).pathname === "/client.js"
        ? new Response(Bun.file(dir + "/client.js"), {
            headers: { "content-type": "text/javascript" },
          })
        : new Response('<script type="module" src="/client.js"></script>', {
            headers: { "content-type": "text/html" },
          }),
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(server.url.toString());
    await page.waitForFunction(() => !!(window as any).result);
    const result = await page.evaluate(() => (window as any).result);
    expect(result.sole).toEqual({ error: null, text: "" });
    expect(result.mixed).toEqual({ error: null, text: "valid" });
  } finally {
    await browser.close();
    server.stop(true);
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
