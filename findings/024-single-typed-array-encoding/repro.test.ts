import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
test("RFC10 typed arrays require enableRichArguments even as the sole argument", async () => {
  const dir = resolve(".build", "finding024-" + process.pid);
  await build(dir, (process.env.BUILD_MODE ?? "development") as BuildMode, {
    client: ["findings/024-single-typed-array-encoding/client.ts"],
    server: ["findings/024-single-typed-array-encoding/server.ts"],
  });
  const ssr = await import(dir + "/server.js");
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      const path = new URL(request.url).pathname;
      return path.startsWith("/_server")
        ? ssr.handle(request)
        : path.endsWith(".js")
          ? new Response(Bun.file(dir + path), { headers: { "content-type": "text/javascript" } })
          : new Response('<script type="module" src="/client.js"></script>', {
              headers: { "content-type": "text/html" },
            });
    },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(String(server.url));
    await page.waitForFunction(() => (window as any).done);
    const result = await page.evaluate(() => (window as any).done);
    expect(result.nested).toContain("enableRichArguments");
    expect(Array.from(result.single.value)).toEqual([65]);
    expect(result.single).toEqual({error:expect.stringContaining("enableRichArguments")});
  } finally {
    await browser.close();
    server.stop(true);
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
