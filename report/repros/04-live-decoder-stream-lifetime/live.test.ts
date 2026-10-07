import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from './build';
test("A connected live source must reconnect after a real TCP drop", async () => {
  const dir = resolve(".build", "finding014-" + process.pid);
  await buildFrames(dir, (process.env.BUILD_MODE ?? "development") as any, {
    client: "live-client.ts",
    server: "live-server.ts",
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
  const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: fetchHandler });
  const downstream = new Set<any>();
  const proxy = Bun.listen<any>({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open(socket) {
        downstream.add(socket);
        socket.data = { pending: [] as Buffer[], upstream: undefined as any };
        Bun.connect({
          hostname: "127.0.0.1",
          port: server.port!,
          socket: {
            open(upstream) {
              socket.data.upstream = upstream;
              for (const bytes of socket.data.pending) upstream.write(bytes);
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
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${proxy.port}`, { waitUntil: "commit" });
    await page.waitForFunction(() => (window as any).state?.values.length === 1, null, {
      timeout: 5000,
    });
    expect(ssr.stats.closed).toBe(0);
    expect(await page.evaluate(() => (window as any).state.status.at(-1))).toBe("connected");
    for (const socket of downstream) socket.terminate();
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as any).state.status)).toContain("reconnecting");
  } finally {
    ssr.release?.();
    await browser.close();
    proxy.stop(true);
    server.stop(true);
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
