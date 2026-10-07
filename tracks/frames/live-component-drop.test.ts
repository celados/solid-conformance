import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
for (const mode of ["development", "observe", "production"] as BuildMode[])
  test(
    "RFC10 live component first-only SSR DOM adoption and real TCP reconnection " +
      mode,
    async () => {
      const dir = resolve(
        ".build",
        "live-component-" + process.pid + "-" + mode,
      );
      await build(dir, mode, {
        client: ["tracks/frames/live-component/client.tsx"],
        server: ["tracks/frames/live-component/server.tsx"],
        serverComponents: true,
      });
      const m = await import(dir + "/server.js");
      const server = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        idleTimeout: 0,
        fetch: (request): Response =>
          new URL(request.url).pathname.startsWith("/_server")
            ? m.handle(request)
            : new URL(request.url).pathname.endsWith(".js")
              ? new Response(Bun.file(dir + new URL(request.url).pathname), {
                  headers: {
                    "content-type": "text/javascript",
                    "access-control-allow-origin": "*",
                  },
                })
              : new URL(request.url).pathname === "/favicon.ico"
                ? new Response(null, { status: 204 })
                : new Response(
                    m.document(request, String(server.url) + "client.js")
                      .readable,
                    { headers: { "content-type": "text/html" } },
                  ),
      });
      const downstream = new Set<any>();
      const proxy = Bun.listen<any>({
        hostname: "127.0.0.1",
        port: 0,
        socket: {
          open(socket) {
            downstream.add(socket);
            socket.data = {
              pending: [] as Buffer[],
              upstream: undefined as any,
            };
            Bun.connect({
              hostname: "127.0.0.1",
              port: server.port!,
              socket: {
                open(upstream) {
                  socket.data.upstream = upstream;
                  for (const bytes of socket.data.pending)
                    upstream.write(bytes);
                  socket.data.pending.length = 0;
                },
                data(_upstream, bytes) {
                  socket.write(bytes);
                },
                close() {
                  socket.end();
                },
                error() {
                  socket.terminate();
                },
              },
            }).catch(() => socket.terminate());
          },
          data(socket, bytes) {
            if (socket.data.upstream) socket.data.upstream.write(bytes);
            else socket.data.pending.push(Buffer.from(bytes));
          },
          close(socket) {
            downstream.delete(socket);
            socket.data.upstream?.terminate();
          },
          error(socket) {
            downstream.delete(socket);
            socket.data.upstream?.terminate();
          },
        },
      });
      const browser = await chromium.launch({
        channel: "chrome",
        headless: true,
      });
      try {
        const page = await browser.newPage();
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (["error", "warning"].includes(m.type())) errors.push(m.text());
        });
        await page.goto(`http://127.0.0.1:${proxy.port}`, {
          waitUntil: "commit",
        });
        await page.waitForFunction(
          () => !!(window as any).liveComponent,
          null,
          { timeout: 5000 },
        );
        await page.waitForFunction(
          () =>
            (window as any).liveComponent.snapshot().statuses[0] ===
            "connected",
          null,
          { timeout: 5000 },
        );
        expect(
          await page.evaluate(() => (window as any).liveComponent.snapshot()),
        ).toMatchObject({ text: "17", adopted: true, statuses: ["connected"] });
        expect(m.stats).toEqual({ calls: 2, opened: 2, closed: 1, cleaned: 1 });
        m.push(35);
        await page.waitForFunction(
          () => (window as any).liveComponent.snapshot().text === "35",
          null,
          { timeout: 2000 },
        );
        expect(errors).toEqual([]);
        for (const socket of downstream) socket.terminate();
        await page.waitForTimeout(1500);
        expect(
          await page.evaluate(() => (window as any).liveComponent.snapshot()),
        ).toMatchObject({
          requests: [
            "/_server/live/live-component",
            "/_server/live/live-component",
          ],
          text: "35",
          adopted: true,
          statuses: ["connected", "reconnecting", "connected"],
        });
        expect(m.stats).toEqual({ calls: 3, opened: 3, closed: 2, cleaned: 2 });
        expect(errors).toEqual([
          "Failed to load resource: net::ERR_CONNECTION_RESET",
        ]);
        expect(m.received).toHaveLength(2);
        expect(Number(m.received[1].position)).toBeGreaterThan(0);
        await page.evaluate(() => (window as any).liveComponent.close());
        for (let i = 0; i < 100 && m.stats.closed < m.stats.calls; i++)
          await new Promise((r) => setTimeout(r, 10));
        expect(m.stats.closed).toBe(m.stats.calls);
      } finally {
        m.push(99);
        await browser.close();
        proxy.stop(true);
        server.stop(true);
        await rm(dir, { recursive: true, force: true });
      }
    },
    30000,
  );
