import { test, expect } from "bun:test";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { buildFrames } from "./build";
import { runtimeReceipt } from "../../harness/runtime";

test("RFC 10/11 real HTTP references and frame CSR/document adoption/state/slots", async () => {
  const mode = (process.env.BUILD_MODE ?? "development") as "development" | "production";
  const directory = resolve(".build", "frames-" + process.pid + "-" + mode);
  await buildFrames(directory, mode);
  const ssr = (await import(directory + "/server.js")) as typeof import("./server");
  const serverOptions = {
    port: 0,
    hostname: "127.0.0.1",
    fetch: async (request: Request) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/_server")) return ssr.handle(request);
      if (url.pathname.endsWith(".js"))
        return new Response(Bun.file(directory + url.pathname), {
          headers: { "content-type": "text/javascript" },
        });
      if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
      if (url.searchParams.has("hydrate"))
        return new Response(ssr.documentStream().readable, {
          headers: { "content-type": "text/html" },
        });
      return new Response(
        '<!doctype html><html><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>',
        { headers: { "content-type": "text/html" } },
      );
    },
  };
  let server = Bun.serve(serverOptions);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const receipt: any = { ...(await runtimeReceipt()), cases: [], serverDocs: [] };
  try {
    receipt.serverDocs = await ssr.documents();
    expect(receipt.serverDocs.filter((r: any) => r.error)).toEqual([]);
    for (const surface of ["csr", "hydrate"]) {
      ssr.reset();
      const page = await browser.newPage();
      const messages: string[] = [];
      page.on("console", (m) => {
        if (["warning", "error"].includes(m.type())) messages.push(m.type() + ": " + m.text());
      });
      page.on("pageerror", (e) => messages.push("pageerror: " + e.message));
      await page.goto(server.url + (surface === "hydrate" ? "?hydrate" : ""));
      await page.waitForFunction(() => !!(window as any).framesHarness);
      await page.evaluate(() => (window as any).framesHarness.pause());
      expect(await page.locator("h1").textContent()).toBe("story-1-generation-0");
      expect(await page.locator("[data-counter]").textContent()).toBe("0nested-server-text-1");
      const boots = await page.evaluate(() => (window as any).framesHarness.requests.length);
      expect(boots).toBe(surface === "hydrate" ? 0 : 1);
      await page.evaluate(() => (window as any).framesHarness.startLive());
      await page.waitForFunction(() => (window as any).framesHarness.liveValues.length === 1);
      await page.waitForFunction(
        () => (window as any).framesHarness.liveStatus.at(-1) === "closed",
      );
      await page.waitForTimeout(50);
      const live = await page.evaluate(() => ({
        values: (window as any).framesHarness.liveValues,
        status: (window as any).framesHarness.liveStatus,
      }));
      expect(live.values.length).toBe(1);
      expect(live.status.at(-1)).toBe("closed");
      expect(ssr.liveStats.closed).toBe(ssr.liveStats.opened);
      receipt.cases.push({ surface, live, stats: { ...ssr.liveStats } });
      const slots = await page.evaluate(() => (window as any).framesHarness.asyncSlots());
      expect(slots[0].text).toBe("async-slot-value");
      expect(slots[0].errors).toBe(0);
      expect(slots[1].text).toContain(
        mode === "production" ? "Internal Server Error" : "private-slot-error",
      );
      expect(slots[1].errors).toBe(1);
      receipt.cases.push({ surface, slots });
      const rpc = await page.evaluate(() => (window as any).framesHarness.rpc());
      expect(rpc.delivery.map((v: any) => v[0])).toEqual(["cache", "frames", "returned"]);
      expect(rpc.delivery[1][1]).toBe("function");
      expect(rpc.plain.args).toEqual(["plain"]);
      expect(rpc.plain.authorization).toBe("Bearer wave3");
      expect(rpc.get).toBe(5);
      expect(rpc.natural.args.title).toBe("natural");
      expect(rpc.boundNatural).toEqual([1, null, { title: "bound" }]);
      expect(rpc.undefinedError).toContain("enableRichArguments");
      expect(rpc.longGet).toBe(rpc.longArg + "1");
      expect(rpc.longRequest.method).toBe("POST");
      expect(rpc.longRequest.address).toContain("/data/wave3-read");
      expect(rpc.richError).toContain("enableRichArguments");
      expect(rpc.richDate).toBe(true);
      expect(rpc.richMap).toBe(true);
      expect(rpc.richRefusals.filter((_e: any, i: number) => i !== 2)).toEqual(
        Array(4).fill(expect.stringContaining("enableRichArguments")),
      );
      // RFC10 names typed arrays as rich-only, but a lone ArrayBufferView is
      // recognized as a natural body. EXPECT_FINDINGS keeps the doc oracle red.
      expect(rpc.richRefusals[2]).toBe(
        process.env.EXPECT_FINDINGS ? expect.stringContaining("enableRichArguments") : null,
      );
      expect(rpc.json).toEqual([{ nested: [1, false, null, "json"] }]);
      expect(rpc.naturalForm).toEqual({ title: "form" });
      expect(rpc.naturalBlob).toBe("blob-body");
      expect(rpc.naturalFile).toEqual({ text: "file-body", name: "fixture.txt" });
      expect(rpc.richShapes).toEqual([true, true, true, true]);
      expect(rpc.unknown.unknown).toBe(true);
      expect(rpc.failure).toBe(
        mode === "production" ? "Internal Server Error" : "private-rpc-error",
      );
      expect(rpc.abort).toBe("AbortError");
      await page.locator("[data-counter]").click();
      expect(await page.locator("[data-counter]").textContent()).toBe("1nested-server-text-1");
      await page.evaluate(() => {
        (window as any).savedCounter = document.querySelector("[data-counter]");
      });
      ssr.advance();
      await page.evaluate(() => {
        (window as any).framesHarness.refetch();
      });
      await page.evaluate(() => (window as any).framesHarness.pause());
      expect(await page.locator("h1").textContent()).toBe("story-1-generation-2");
      expect(
        await page.evaluate(
          () => (window as any).savedCounter === document.querySelector("[data-counter]"),
        ),
      ).toBe(true);
      expect(await page.locator("[data-counter]").textContent()).toBe("1nested-server-text-1");
      await page.evaluate(() => {
        (window as any).framesHarness.change(2);
      });
      await page.evaluate(() => (window as any).framesHarness.pause());
      expect(await page.locator("h1").textContent()).toBe("story-2-generation-2");
      receipt.cases.push({
        surface,
        argumentChange: {
          cid: await page.locator("[data-counter]").getAttribute("data-counter"),
          text: await page.locator("[data-counter]").textContent(),
        },
      });
      expect(await page.locator("[data-counter]").textContent()).toBe(
        process.env.EXPECT_FINDINGS === "1" ? "1nested-server-text-2" : "1nested-server-text-1",
      );
      await page.evaluate(() => {
        (window as any).framesHarness.change(1);
      });
      await page.evaluate(() => (window as any).framesHarness.pause());
      expect(await page.locator("[data-counter]").textContent()).toBe("1nested-server-text-1");
      expect(
        await page.evaluate(() =>
          (window as any).framesHarness.hooks.some((h: any) => h.meta?.requiresAuth),
        ),
      ).toBe(true);
      await page.evaluate(() => {
        (window as any).framesHarness.unmount();
      });
      expect(await page.locator("#root").textContent()).toBe("");
      expect(messages).toEqual([
        "error: Failed to load resource: the server responded with a status of 404 (Not Found)",
        "error: Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
      ]);
      receipt.cases.push({ surface, boots, rpc, messages, invocations: [...ssr.invocations] });
      await page.close();
    }
  } finally {
    await Bun.write(`artifacts/frames-${mode}.json`, JSON.stringify(receipt, null, 2));
    await browser.close();
    server.stop(true);
    await rm(directory, { recursive: true, force: true });
  }
}, 120000);
