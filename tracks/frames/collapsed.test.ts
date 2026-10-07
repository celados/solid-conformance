import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from "./build";
// RFC 11 L99:2: a collapsed wrapper flips undisplayed SSR content to data,
// later mounts it from the client store with zero network; single-copy L95.
test("RFC11 collapsed SSR slot later mounts from retained data with zero network", async () => {
  const dir = resolve(".build", "collapsed-" + process.pid);
  await buildFrames(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: "tracks/frames/collapsed-client.tsx",
    server: "tracks/frames/collapsed-server.tsx",
  });
  const ssr = await import(dir + "/collapsed-server.js");
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: (request) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/_server")) return ssr.handle(request);
      if (url.pathname.endsWith(".js"))
        return new Response(Bun.file(dir + url.pathname), {
          headers: { "content-type": "text/javascript" },
        });
      if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
      if (url.searchParams.has("hydrate"))
        return new Response(ssr.documentStream().readable, {
          headers: { "content-type": "text/html" },
        });
      return new Response(
        '<div id="root"></div><script type="module" src="/collapsed-client.js"></script>',
        { headers: { "content-type": "text/html" } },
      );
    },
  });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const wire = await ssr.documentStream();
    const html = await wire;
    expect((html.match(/nested-single-copy-token/g) ?? []).length).toBe(1);
    for (const hydrate of [false, true]) {
      const page = await browser.newPage();
      const messages: string[] = [];
      page.on("console", (m) => {
        if (["warning", "error"].includes(m.type())) messages.push(m.text());
      });
      page.on("pageerror", (e) => messages.push(e.message));
      await page.goto(server.url + (hydrate ? "?hydrate" : ""));
      await page.locator("[data-expand]").waitFor();
      expect(await page.locator("[data-server-only]").count()).toBe(0);
      const count = await page.evaluate(() => (window as any).collapsed.requests.length);
      expect(count).toBe(hydrate ? 0 : 1);
      await page.locator("[data-expand]").click();
      await page.locator("[data-server-only]").waitFor();
      expect(await page.locator("[data-server-only]").textContent()).toBe(
        "nested-single-copy-token",
      );
      expect(await page.evaluate(() => (window as any).collapsed.requests.length)).toBe(count);
      await page.evaluate(() => (window as any).collapsed.unmount());
      expect(await page.locator("#root").textContent()).toBe("");
      expect(messages).toEqual([]);
      await page.close();
    }
  } finally {
    await browser.close();
    server.stop(true);
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
