import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const variant of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC08 streamed fragment rejection recovers fresh DOM and reports its cost " + variant,
    async () => {
      const dir = resolve(".build", "recovery-" + process.pid + "-" + variant);
      await build(dir, variant, {
        client: ["tracks/frames/recovery-client.tsx"],
        server: ["tracks/frames/recovery-server.tsx"],
      });
      const ssr = await import(dir + "/recovery-server.js");
      const server = Bun.serve({
        port: 0,
        hostname: "127.0.0.1",
        fetch: (request) => {
          const url = new URL(request.url);
          if (url.pathname.endsWith(".js"))
            return new Response(Bun.file(dir + url.pathname), {
              headers: { "content-type": "text/javascript" },
            });
          if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
          return new Response(ssr.documentStream(Number(url.searchParams.get("delay"))).readable, {
            headers: { "content-type": "text/html" },
          });
        },
      });
      const browser = await chromium.launch({ channel: "chrome", headless: true });
      try {
        const rows: any[] = [];
        for (const delay of [0, 500]) {
          ssr.records.length = 0;
          const page = await browser.newPage();
          const messages: string[] = [];
          page.on("console", (m) => {
            if (["error", "warning"].includes(m.type())) messages.push(m.text());
          });
          page.on("pageerror", (e) => messages.push(e.message));
          await page.goto(server.url + "?delay=" + delay, { waitUntil: "commit" });
          await page.waitForFunction(() => !!(window as any).recovery);
          await page.waitForFunction(
            () => document.querySelector("[data-recovered]")?.textContent === "recovered",
          );
          await page.waitForTimeout(50);
          const records = await page.evaluate(() => (window as any).recovery.records);
          expect(records.length).toBe(variant === "production" ? 0 : 1);
          if (records.length) {
            const record = records[0];
            expect(record.event.id).toBe(ssr.records[0].event.id);
            expect(record.event.at).toBeGreaterThanOrEqual(0);
            expect(record.event.renderMs).toBeGreaterThanOrEqual(0);
            expect(record.event.waitedMs).toBeGreaterThanOrEqual(0);
            expect(record.live).toEqual({});
          }
          rows.push({ delay, client: records, server: ssr.records.slice(), messages });
          await page.evaluate(() => (window as any).recovery.unmount());
          expect(await page.locator("#root").textContent()).toBe("");
          expect(messages).toEqual([]);
          await page.close();
        }
        await Bun.write("artifacts/recovery-" + variant + ".json", JSON.stringify(rows, null, 2));
      } finally {
        await browser.close();
        server.stop(true);
        await rm(dir, { recursive: true, force: true });
      }
    },
    30000,
  );
