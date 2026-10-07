import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const mode of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC10 live source SSR first-value closes and hydration takes over " + mode,
    async () => {
      const dir = resolve(".build", "live-adoption-" + process.pid + "-" + mode);
      await build(dir, mode, {
        client: ["tracks/frames/live-adoption/client.tsx"],
        server: ["tracks/frames/live-adoption/server.tsx"],
      });
      const ssr = await import(dir + "/server.js");
      const html = await ssr.documentStream();
      expect(html).toContain("first");
      expect(html).not.toContain("second");
      expect(ssr.stats).toEqual({ opened: 1, closed: 1 });
      const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch(request) {
          const u = new URL(request.url);
          return u.pathname.startsWith("/_server")
            ? ssr.handle(request)
            : u.pathname.endsWith(".js")
              ? new Response(Bun.file(dir + u.pathname), {
                  headers: { "content-type": "text/javascript" },
                })
              : new Response(
                  u.search
                    ? ""
                    : '<div id="root"></div><script type="module" src="/client.js"></script>',
                  { headers: { "content-type": "text/html" } },
                );
        },
      });
      const browser = await chromium.launch({ channel: "chrome", headless: true });
      try {
        for (const surface of ["csr", "hydrate"]) {
          const page = await browser.newPage();
          const errors: string[] = [];
          page.on("pageerror", (e) => errors.push(e.message));
          page.on("console", (m) => {
            if (["warning", "error"].includes(m.type())) errors.push(m.text());
          });
          if (surface === "hydrate")
            await page.route(String(server.url) + "?hydrate", (route) =>
              route.fulfill({ body: html, contentType: "text/html" }),
            );
          await page.goto(server.url + (surface === "hydrate" ? "?hydrate" : ""));
          await page.waitForFunction(
            () => document.querySelector("[data-value]")?.textContent === "second",
          );
          const requests = await page.evaluate(() => (window as any).liveAdoption.requests);
          expect(requests.length).toBe(1);
          expect(requests[0].address).toContain("/live/live-adoption");
          expect(requests[0].headers.some((h: any[]) => h[0].includes("single-flight"))).toBe(
            false,
          );
          expect(errors).toEqual([]);
          await page.evaluate(() => (window as any).liveAdoption.unmount());
          expect(await page.locator("#root").textContent()).toBe("");
          await page.close();
        }
      } finally {
        await browser.close();
        server.stop(true);
        await rm(dir, { recursive: true, force: true });
      }
    },
    30000,
  );
