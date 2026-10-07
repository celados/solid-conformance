import { test, expect } from "bun:test";
import { build, type BuildMode } from "../../scripts/build";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
for (const variant of ["development", "observe", "production"] as BuildMode[])
  test("RFC08 binding server reasons " + variant, async () => {
    const directory = resolve(".build", "binding-server-" + process.pid + "-" + variant);
    try {
      await build(directory, variant, {
        client: [],
        server: ["tracks/frames/binding-server.tsx"],
        serverComponents: true,
      });
      const module = await import(directory + "/binding-server.js");
      const results = await module.run();
      await Bun.write(
        "artifacts/binding-server-" + variant + ".json",
        JSON.stringify(results, null, 2),
      );
      expect(results.filter((r: any) => r.error)).toEqual([]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

import { chromium } from "playwright";
for (const variant of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC08 binding client shapes and orphan records " + variant,
    async () => {
      const directory = resolve(".build", "binding-client-" + process.pid + "-" + variant);
      await build(directory, variant, {
        client: ["tracks/frames/binding-client.tsx"],
        server: ["tracks/frames/binding-server.tsx"],
        serverComponents: true,
      });
      const module = await import(directory + "/binding-server.js");
      const server = Bun.serve({
        port: 0,
        hostname: "127.0.0.1",
        fetch: (request) => {
          const url = new URL(request.url);
          if (url.pathname.startsWith("/_server")) return module.handle(request);
          if (url.pathname.endsWith(".js"))
            return new Response(Bun.file(directory + url.pathname), {
              headers: { "content-type": "text/javascript" },
            });
          if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
          return new Response(
            '<div id="root"></div><script type="module" src="/binding-client.js"></script>',
            { headers: { "content-type": "text/html" } },
          );
        },
      });
      const browser = await chromium.launch({ channel: "chrome", headless: true });
      try {
        const page = await browser.newPage();
        await page.goto(String(server.url));
        await page.waitForFunction(() => !!(window as any).binding);
        const results: any[] = [];
        for (const shape of [
          "array",
          "null",
          "number",
          "async",
          "node",
          "text-object",
          "text-array",
          "text-function",
          "text-async",
          "missing-fill",
          "valid",
        ]) {
          const result = await page.evaluate((s) => (window as any).binding.run(s), shape);
          results.push({ shape, ...result });
          const events = result.events.filter((e: any) => e.code === "BINDING_SLOT_POSITION");
          expect(events.length).toBe(variant === "development" && shape !== "valid" ? 1 : 0);
          if (events.length) {
            expect(events[0].data.reason).toBe(
              shape === "missing-fill"
                ? "orphan"
                : shape.startsWith("text-")
                  ? "text-shape"
                  : "fill-shape",
            );
            expect(events[0].severity).toBe("warn");expect(events[0].kind).toBe("render");
            expect(events[0].data.occurrence).toBe("row#0");
            if(shape === "missing-fill"){expect(events[0].data.why).toBe("fill");expect(events[0].data.elements).toHaveLength(1)}
            else{const shapes:Record<string,string>={array:"an array",null:"null",number:"number",async:"an async value",node:"a DOM node","text-object":"object","text-array":"an array","text-function":"function","text-async":"an async value"};expect(events[0].data.shape).toBe(shapes[shape]);if(shape.startsWith("text-"))expect(events[0].data.key).toBe("title")}

          }
          expect(result.remaining).toBe("");
          if (shape === "valid") {
            expect(result.text).toBe("works");
            expect(result.clicked).toBe(1);
          } else expect(result.text).toBe("");
        }
        await page.goto(server.url + "?omit-record");
        await page.waitForFunction(() => !!(window as any).binding);
        const missing = await page.evaluate(() => (window as any).binding.run("valid"));
        const orphan = missing.events.filter((e: any) => e.code === "BINDING_SLOT_POSITION");
        expect(orphan.length).toBe(variant === "development" ? 1 : 0);
        if (orphan.length) {
          expect(orphan[0].data.reason).toBe("orphan");expect(orphan[0].kind).toBe("render");expect(orphan[0].severity).toBe("warn");
          expect(orphan[0].data.why).toBe("record");
          expect(orphan[0].data.elements.length).toBe(1);
        }
        await page.goto(server.url + "?corrupt");
        await page.waitForFunction(() => !!(window as any).binding);
        const corrupted = await page.evaluate(() => (window as any).binding.run("corrupt"));
        const markerEvents = corrupted.events.filter(
          (e: any) => e.code === "FRAME_MARKER_CORRUPTED",
        );
        // Finding 020 retains the red documented observe-tier oracle separately.
        if (variant === "development") expect(markerEvents.length).toBeGreaterThan(0);
        else expect(markerEvents.length).toBe(0);
        if (markerEvents.length) {
          expect(markerEvents[0].severity).toBe("error");
          expect(markerEvents[0].data.slot).toBe("children");
          expect(markerEvents[0].data.end).toBe("slot:children:end");
        }
        await Bun.write(
          "artifacts/binding-client-" + variant + ".json",
          JSON.stringify({ results, missing }, null, 2),
        );
      } finally {
        await browser.close();
        server.stop(true);
        await rm(directory, { recursive: true, force: true });
      }
    },
    30000,
  );
