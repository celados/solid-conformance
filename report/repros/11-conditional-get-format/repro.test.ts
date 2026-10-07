import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "./build";
const mode = (process.env.BUILD_MODE ?? "development") as BuildMode;
test(
  "RFC10 browser owns conditional GET exchange " + mode,
  async () => {
    const dir = resolve(".build", "conditional-" + process.pid + "-" + mode);
    await build(dir, mode, { client: ["./client.ts"], server: ["./server.ts"] });
    const module = await import(dir + "/server.js");
    const server = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(req) {
        const url = new URL(req.url);
        return url.pathname.startsWith("/_server")
          ? module.handle(req)
          : url.pathname.endsWith(".js")
            ? new Response(Bun.file(dir + url.pathname), {
                headers: { "content-type": "text/javascript" },
              })
            : new Response('<script type="module" src="/client.js"></script>', {
                headers: { "content-type": "text/html" },
              });
      },
    });
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    try {
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(String(server.url));
      await page.waitForFunction(() => !!(window as any).conditional);
      const result = await page.evaluate(() => (window as any).conditional);
      console.log({ calls: module.calls, result });
      expect(module.calls).toEqual([null, '"constant"']);
      expect(result.statuses).toEqual([200, 200]);
      expect(result.first).toEqual({ value: 17 });
      expect(result.hints.every((h: any) => !h["if-none-match"])).toBe(true);
      expect(errors).toEqual([]);
      expect(result.second).toEqual({ value: 17 });
    } finally {
      await browser.close();
      server.stop(true);
      await rm(dir, { recursive: true, force: true });
    }
  },
  30000,
);
