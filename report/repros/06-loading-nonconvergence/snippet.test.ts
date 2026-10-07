import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { build, type BuildMode } from "./build";
test("Readable App reproduces 06-loading-nonconvergence", async () => {
  const mode = (process.env.BUILD_MODE ?? "development") as BuildMode;
  const dir = resolve(".build/snippet");
  await build(dir, mode, { client: ["./snippet-client.tsx"], server: [] });
  const server = Bun.serve({
    port: 0,
    fetch: (request) =>
      new URL(request.url).pathname.endsWith(".js")
        ? new Response(Bun.file(dir + new URL(request.url).pathname), {
            headers: { "content-type": "text/javascript" },
          })
        : new Response(
            '<div id="root"></div><script type="module" src="/snippet-client.js"></script>',
            { headers: { "content-type": "text/html" } },
          ),
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(server.url.toString());
    await page.waitForFunction(() => document.querySelector("#answer")?.textContent === "11");
    await page.locator("#trigger").click();
    await page.waitForTimeout(250);
    expect(errors).toEqual([]);
    expect(await page.locator("#answer").textContent()).toBe("22");
  } finally {
    await browser.close();
    server.stop(true);
  }
}, 30000);
