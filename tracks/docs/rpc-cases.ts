import {
  isServer,
  isDev,
  getRequestEvent,
  redirect,
  reload,
  respond,
  markSafeError,
  isSafeError,
} from "@solidjs/web";
import * as sf from "@solidjs/web/server-functions";
import { equal, ok, throws, type DocCase } from "./registry";
const cases: DocCase[] = [];
function doc(name: string, statement: string, run: DocCase["run"]) {
  cases.push({ id: `10/${name}`, file: "10-server-functions.md", statement, run });
}
let serial = 0;
function reference(fn: (...args: any[]) => any) {
  return server.createServerReference(
    server.registerServerReference("docs-" + serial++, fn),
  ) as sf.ServerFunction<any[], any>;
}
const server = sf as unknown as typeof import("@solidjs/web/server-functions/server");
function request(id: string, method = "POST", body?: unknown) {
  return new Request("http://conformance.test/_server/data/" + id, {
    method,
    headers: {
      origin: "http://conformance.test",
      "content-type": "application/json",
      "X-Server-Function-Format": "8",
    },
    ...(method === "POST" ? { body: JSON.stringify(body ?? []) } : {}),
  });
}

if (isServer) {
  doc(
    "direct-call",
    "In-process SSR calls execute the original function directly with no HTTP loopback.",
    async () => {
      const fn = reference((n: number) => n + 1);
      equal(await fn(2), 3);
    },
  );
  doc("reference-id", "Both proxies carry id and url.", () => {
    const fn = reference(() => 7);
    ok(fn.id.startsWith("docs-"));
    ok(fn.url.includes(fn.id));
  });
  doc("reference-brand", "isServerFunction reads the symbol-branded reference contract.", () => {
    const fn = reference(() => 7);
    equal(sf.isServerFunction(fn), true);
    equal(
      sf.isServerFunction(() => 7),
      false,
    );
  });
  doc("reference-nonfunction", "registerServerReference throws when handed a non-function.", () => {
    throws(() => reference(7 as any));
  });
  doc(
    "metadata-merge",
    "withMeta returns the reference and shallow-merges later writes over earlier ones.",
    () => {
      const fn = reference(() => 7);
      const a = sf.withMeta(fn, { a: 1, nested: { old: true } });
      const b = sf.withMeta(a, { a: 2, nested: { new: true } });
      equal(sf.getServerFunctionMetadata(b)?.a, 2);
      equal(sf.getServerFunctionMetadata(b)?.nested, { new: true });
    },
  );
  doc("get-metadata", "GET composes with withMeta in either order.", () => {
    const fn = reference(() => 7);
    const decorated = sf.GET(sf.withMeta(fn, { custom: 1 }));
    equal(sf.getServerFunctionMetadata(decorated)?.method, "GET");
    equal(sf.getServerFunctionMetadata(decorated)?.custom, 1);
  });
  doc(
    "http-dispatch",
    "The handler resolves id, decodes positional arguments and encodes the result.",
    async () => {
      const fn = reference((a: number, b: number) => a + b);
      const response = await server.handleServerFunctionRequest(request(fn.id, "POST", [2, 3]));
      equal(response.status, 200);
      equal(await sf.decodeResponse(response), 5);
    },
  );
  doc(
    "default-post",
    "Undeclared references call over POST; GET requires declaration.",
    async () => {
      const fn = reference(() => 7);
      const response = await server.handleServerFunctionRequest(request(fn.id, "GET"));
      equal(response.status, 405);
    },
  );
  doc(
    "get-read",
    "GET declared references permit GET and HEAD without a body on HEAD.",
    async () => {
      const fn = sf.GET(reference(() => 7));
      const read = await server.handleServerFunctionRequest(request(fn.id, "GET"));
      equal(read.status, 200);
      equal(await sf.decodeResponse(read), 7);
      const head = await server.handleServerFunctionRequest(request(fn.id, "HEAD"));
      equal(head.status, 200);
      equal(head.body, null);
    },
  );
  doc("method-405", "Other methods receive 405.", async () => {
    const fn = reference(() => 7);
    equal((await server.handleServerFunctionRequest(request(fn.id, "DELETE"))).status, 405);
  });
  doc(
    "unknown-reference",
    "An unregistered well-formed address receives a labelled 404.",
    async () => {
      const response = await server.handleServerFunctionRequest(request("missing-function-id"));
      equal(response.status, 404);
      ok(response.headers.has("X-Server-Function-Unknown"));
    },
  );
  doc(
    "no-store-default",
    "Every response has Cache-Control no-store unless the function declares a policy.",
    async () => {
      const fn = reference(() => 7);
      const response = await server.handleServerFunctionRequest(request(fn.id));
      equal(response.headers.get("cache-control"), "no-store");
    },
  );
  doc("cache-opt-in", "Cache headers flow through the handler response metadata.", async () => {
    const fn = sf.GET(reference(() => respond(7, { headers: { "cache-control": "max-age=60" } })));
    const response = await server.handleServerFunctionRequest(request(fn.id, "GET"));
    equal(response.headers.get("cache-control"), "max-age=60");
    equal(await sf.decodeResponse(response), 7);
  });
  doc(
    "redirect-control",
    "Thrown Response/envelope control flow is forwarded untouched.",
    async () => {
      const fn = reference(() => {
        throw redirect("/login");
      });
      const response = await server.handleServerFunctionRequest(request(fn.id));
      ok(response.headers.get(sf.REDIRECT_HEADER) || response.headers.get("Location"));
    },
  );
  doc(
    "thrown-sanitization",
    "Outside development plain thrown errors are replaced with a generic Error.",
    async () => {
      const fn = reference(() => {
        throw new Error("private-detail");
      });
      const response = await server.handleServerFunctionRequest(request(fn.id), {
        onError: () => {},
      });
      const error = await sf.decodeResponse(response).catch((e) => e);
      ok(error instanceof Error);
      equal((error as Error).message, isDev ? "private-detail" : "Internal Server Error");
    },
  );
  doc(
    "per-call-event",
    "Direct calls get a shallow copy of locals while nested values remain shared.",
    async () => {
      const event = getRequestEvent()!;
      event.locals.token = "outer";
      event.locals.shared = { n: 1 };
      const fn = reference(() => {
        const e = getRequestEvent()!;
        equal(e.locals.token, "outer");
        e.locals.token = "inner";
        return e.locals.shared;
      });
      equal((await fn()) === event.locals.shared, true);
      equal(event.locals.token, "outer");
    },
  );
  doc(
    "invocation-context",
    "getServerFunctionInvocation answers the current in-flight id.",
    async () => {
      let fn: ReturnType<typeof reference>;
      fn = reference(() => server.getServerFunctionInvocation()?.id);
      equal(await fn(), fn.id);
    },
  );
  doc("invoke-direct", "Server invoke runs in-process; transport hints are no-ops.", async () => {
    const fn = reference((n: number) => n + 1);
    equal(await sf.invoke(fn, { priority: "low", keepalive: true }, 3), 4);
  });
  doc("invoke-contract", "Non-invocable wrappers produce a directed error.", () => {
    throws(() => sf.invoke((() => 7) as any, {}));
  });
}
export const rpcCases = cases;

if (isServer) {
  doc(
    "direct-invoke-abort",
    "Server invoke signal rejects the caller while the in-process work runs to completion.",
    async () => {
      let finished = false;
      const fn = reference(async () => {
        await new Promise((r) => setTimeout(r, 20));
        finished = true;
        return 7;
      });
      const c = new AbortController();
      const pending = sf.invoke(fn, { signal: c.signal });
      c.abort(new Error("caller-aborted"));
      equal((await pending.catch((e) => e)).message, "caller-aborted");
      await new Promise((r) => setTimeout(r, 30));
      equal(finished, true);
    },
  );
  doc(
    "invoke-refusals",
    "invoke refuses raw RequestInit options with a pointer to their lifetime home.",
    () => {
      const fn = reference(() => 7);
      for (const option of ["headers", "method", "retries", "timeout"]) {
        throws(() => sf.invoke(fn, { [option]: 1 } as any));
      }
    },
  );
  doc(
    "direct-wrap-invocation",
    "Configured wrapInvocation wraps direct SSR calls inside their invocation identity.",
    async () => {
      let seen: any;
      server.configureServerFunctionsServer({
        wrapInvocation: (run, context) => {
          seen = {
            id: context.id,
            direct: context.direct,
            invocation: server.getServerFunctionInvocation()?.id,
          };
          return run();
        },
      });
      try {
        const fn = reference(() => 7);
        equal(await fn(), 7);
        equal(seen, { id: fn.id, direct: true, invocation: fn.id });
      } finally {
        server.configureServerFunctionsServer({ wrapInvocation: (run) => run() });
      }
    },
  );
  doc(
    "http-wrap-invocation",
    "Per-handler wrapInvocation runs inside the request-event scope and may replace the result.",
    async () => {
      const fn = reference(() => 7);
      const response = await server.handleServerFunctionRequest(request(fn.id), {
        wrapInvocation: (run, context) => {
          equal(context.direct, false);
          equal(server.getServerFunctionInvocation()?.id, fn.id);
          ok(getRequestEvent());
          return 9;
        },
      });
      equal(await sf.decodeResponse(response), 9);
    },
  );
  doc(
    "transform-return-and-throw",
    "transformResult observes both returned and thrown results before encoding.",
    async () => {
      for (const fail of [false, true]) {
        const fn = reference(() => {
          if (fail) throw respond({ ok: false }, { status: 400 });
          return 7;
        });
        let seen = 0;
        const response = await server.handleServerFunctionRequest(request(fn.id), {
          transformResult: (_event, result) => {
            seen++;
            return result;
          },
        });
        equal(seen, 1);
        equal(response.status, fail ? 400 : 200);
      }
    },
  );
  doc(
    "single-flight-sources",
    "Single-flight collects source-keyed slices only for scripted calls with the request header.",
    async () => {
      const fn = reference(() => 7);
      let collected = 0;
      const hook = () => {
        collected++;
        return { fresh: 9 };
      };
      let r = await server.handleServerFunctionRequest(request(fn.id), { collectFlightData: hook });
      equal(r.headers.has(sf.SINGLE_FLIGHT_HEADER), false);
      equal(collected, 0);
      const req = request(fn.id);
      req.headers.set(sf.SINGLE_FLIGHT_HEADER, "true");
      r = await server.handleServerFunctionRequest(req, { collectFlightData: hook });
      ok(r.headers.get(sf.SINGLE_FLIGHT_HEADER)?.includes("true"));
      equal(await sf.decodeResponse(r), { value: 7, data: { true: { fresh: 9 } } });
      equal(collected, 1);
    },
  );
  doc(
    "named-flight-sources",
    "registerFlightDataSource named collectors are folded beside the unnamed hook.",
    async () => {
      const fn = reference(() => 7);
      const cleanup = server.registerFlightDataSource("docs-cache", () => ({ n: 1 }));
      try {
        const req = request(fn.id);
        req.headers.set(sf.SINGLE_FLIGHT_HEADER, "docs-cache");
        const r = await server.handleServerFunctionRequest(req);
        equal(await sf.decodeResponse(r), { value: 7, data: { "docs-cache": { n: 1 } } });
      } finally {
        cleanup();
      }
    },
  );
  doc(
    "no-js-form",
    "Bare action URLs dispatch FormData as a lone argument and invoke handleNoJS.",
    async () => {
      const fn = reference((form: FormData) => form.get("title"));
      const form = new FormData();
      form.set("title", "documented");
      const req = new Request("http://conformance.test/_server/" + fn.id, {
        method: "POST",
        headers: { origin: "http://conformance.test" },
        body: form,
      });
      let seen: any;
      const r = await server.handleServerFunctionRequest(req, {
        handleNoJS: (result, _req, args, thrown) => {
          seen = { result, args: args.length, thrown: !!thrown };
          return new Response(String(result));
        },
      });
      equal(await r.text(), "documented");
      equal(seen, { result: "documented", args: 1, thrown: false });
    },
  );
  doc(
    "no-js-get-form",
    "Bare GET query fields which are not argument encoding become URLSearchParams.",
    async () => {
      const fn = sf.GET(reference((q: URLSearchParams) => q.get("title")));
      const req = new Request("http://conformance.test/_server/" + fn.id + "?title=hello");
      const r = await server.handleServerFunctionRequest(req, {
        handleNoJS: (r) => new Response(String(r)),
      });
      equal(await r.text(), "hello");
    },
  );
  doc(
    "malformed-args",
    "A reserved args query value which is not an argument array receives 400.",
    async () => {
      const fn = sf.GET(reference(() => 7));
      const req = new Request("http://conformance.test/_server/data/" + fn.id + "?args=7");
      equal((await server.handleServerFunctionRequest(req)).status, 400);
    },
  );
}
if (isServer) {
  doc(
    "reference-dev-name",
    "Compiler-static dev name metadata seeds the channel and explicit metadata shallow-merges over it.",
    () => {
      const fn = server.createServerReference(
        server.registerServerReference("docs-named", () => 7, "original"),
      );
      equal(sf.getServerFunctionMetadata(fn)?.name, "original");
      sf.withMeta(fn, { name: "explicit" });
      equal(sf.getServerFunctionMetadata(fn)?.name, "explicit");
    },
  );
  doc(
    "removed-reference-properties",
    "Client references no longer expose GET and withOptions compatibility properties.",
    () => {
      const fn = reference(() => 7);
      equal((fn as any).GET, undefined);
      equal((fn as any).withOptions, undefined);
    },
  );
  doc(
    "action-url-roundtrip",
    "Action URLs preserve the function id and plain JSON bound arguments.",
    () => {
      const fn = reference(() => 7);
      const url = server.serverFunctionActionUrl(fn, 3, "a");
      const parsed = server.parseServerFunctionActionUrl(url)!;
      equal(parsed, fn.id);
      equal(JSON.parse(new URL(url, "http://conformance.test").searchParams.get("args")!), [
        3,
        "a",
      ]);
      ok(!url.includes("/data/"));
    },
  );
  doc(
    "get-data-url",
    "serverFunctionUrl is the GET scripted data address, distinct from the form action url.",
    () => {
      const fn = sf.GET(reference(() => 7));
      const url = server.serverFunctionUrl(fn, 3);
      ok(url.includes("/data/" + fn.id));
      ok(url.includes("args="));
      throws(() =>
        server.serverFunctionUrl(
          reference(() => 7),
          3,
        ),
      );
    },
  );
  doc(
    "no-js-bound-body",
    "Leading bound args ride the action query while trailing FormData stays a natural body.",
    async () => {
      const fn = reference((id: number, form: FormData) => id + ":" + form.get("title"));
      const url = server.serverFunctionActionUrl(fn, 3);
      const form = new FormData();
      form.set("title", "name");
      const req = new Request("http://conformance.test" + url, {
        method: "POST",
        headers: { origin: "http://conformance.test" },
        body: form,
      });
      const response = await server.handleServerFunctionRequest(req, {
        handleNoJS: (r) => new Response(String(r)),
      });
      equal(await response.text(), "3:name");
    },
  );
  doc(
    "request-event-create",
    "createEvent receives a standards-shaped Request and controls locals in the invocation.",
    async () => {
      const fn = reference(() => getRequestEvent()!.locals.test);
      const response = await server.handleServerFunctionRequest(request(fn.id), {
        createEvent: (r) => {
          ok(r instanceof Request);
          return { ...getRequestEvent()!, request: r, locals: { test: 9 } };
        },
      });
      equal(await sf.decodeResponse(response), 9);
    },
  );
  doc("raw-response", "A raw Response tagged X-Content-Raw travels untouched.", async () => {
    const fn = reference(
      () =>
        new Response("raw-text", {
          status: 201,
          headers: { "X-Content-Raw": "true", "x-custom": "yes" },
        }),
    );
    const r = await server.handleServerFunctionRequest(request(fn.id));
    equal(r.status, 201);
    equal(r.headers.get("x-custom"), "yes");
    equal(await r.text(), "raw-text");
  });
  doc(
    "intentional-error-envelope",
    "Thrown respond envelopes preserve status and intentional carried content in production.",
    async () => {
      const fn = reference(() => {
        throw respond({ name: "ValidationError", issues: ["required"] }, { status: 400 });
      });
      const r = await server.handleServerFunctionRequest(request(fn.id));
      equal(r.status, 400);
      equal(await sf.decodeResponse(r).catch((e) => e), {
        name: "ValidationError",
        issues: ["required"],
      });
    },
  );
  doc(
    "bare-404",
    "A path not meaningful under the address scheme remains a bare 404, without skew marker.",
    async () => {
      const response = await server.handleServerFunctionRequest(
        new Request("http://conformance.test/not-an-address", {
          headers: { origin: "http://conformance.test" },
        }),
      );
      equal(response.status, 404);
      equal(response.headers.has(sf.UNKNOWN_HEADER), false);
    },
  );
}
if (isServer) {
  doc(
    "response-envelope-body",
    "respond carries a real JSON Response body for unscripted consumers.",
    async () => {
      const envelope = respond({ answer: 7 }, { status: 201, headers: { "x-answer": "yes" } });
      equal(envelope.response!.status, 201);
      equal(await envelope.response!.json(), { answer: 7 });
      equal(envelope.response!.headers.get("x-answer"), "yes");
    },
  );
  doc(
    "redirect-masking",
    "Scripted redirect statuses are masked to 200 and Location is replaced by an absolute redirect carrier.",
    async () => {
      const fn = reference(() => redirect("/target"));
      const response = await server.handleServerFunctionRequest(request(fn.id));
      equal(response.status, 200);
      equal(response.headers.get("location"), null);
      ok(response.headers.get(sf.REDIRECT_HEADER));
      const plain = await server.handleServerFunctionRequest(
        new Request("http://conformance.test/_server/" + fn.id, {
          method: "POST",
          body: new FormData(),
          headers: { origin: "http://conformance.test" },
        }),
      );
      equal(plain.status, 302);
      equal(plain.headers.get("location"), "http://conformance.test/target");
    },
  );
  doc(
    "created-location",
    "An authored Location on a non-redirect 201 response remains response data.",
    async () => {
      const fn = reference(() => respond(7, { status: 201, headers: { location: "/created" } }));
      const response = await server.handleServerFunctionRequest(request(fn.id));
      equal(response.status, 201);
      equal(response.headers.get("location"), "/created");
      equal(response.headers.has(sf.REDIRECT_HEADER), false);
    },
  );
  doc(
    "rich-result-codec",
    "Results always travel through the codec, independent of rich-argument opt-in.",
    async () => {
      const fn = reference(() => ({
        date: new Date("2020-01-01"),
        map: new Map([["n", 1]]),
        set: new Set([2]),
        bytes: new Uint8Array([3]),
      }));
      const response = await server.handleServerFunctionRequest(request(fn.id));
      const result = await sf.decodeResponse<any>(response);
      ok(result.date instanceof Date);
      ok(result.map instanceof Map);
      ok(result.set instanceof Set);
      ok(result.bytes instanceof Uint8Array);
      equal(result.bytes[0], 3);
    },
  );
  doc(
    "single-flight-after-transform",
    "collectFlightData receives the transformed outcome with id, request, value, response and thrown fields.",
    async () => {
      const fn = reference(() => 7);
      const req = request(fn.id);
      req.headers.set(sf.SINGLE_FLIGHT_HEADER, "true");
      let outcome: any;
      const response = await server.handleServerFunctionRequest(req, {
        transformResult: () => 9,
        collectFlightData: (event, o) => {
          ok(event.request instanceof Request);
          outcome = o;
          return { cached: o.value };
        },
      });
      equal(outcome.id, fn.id);
      equal(outcome.value, 9);
      equal(outcome.thrown, false);
      ok(outcome.request instanceof Request);
      equal(await sf.decodeResponse(response), { value: 9, data: { true: { cached: 9 } } });
    },
  );
  doc(
    "per-request-transform-override",
    "Per-handler transformResult overrides server-wide configuration.",
    async () => {
      const fn = reference(() => 7);
      server.configureServerFunctionsServer({ transformResult: () => 8 });
      try {
        equal(
          await sf.decodeResponse(
            await server.handleServerFunctionRequest(request(fn.id), { transformResult: () => 9 }),
          ),
          9,
        );
      } finally {
        server.configureServerFunctionsServer({ transformResult: (_event, result) => result });
      }
    },
  );
  doc(
    "nonfunction-metadata",
    "getServerFunctionMetadata answers undefined for an unbranded function.",
    () => {
      equal(
        sf.getServerFunctionMetadata(() => 7),
        undefined,
      );
      equal(sf.getServerFunctionMetadata(null), undefined);
    },
  );
  doc(
    "invoke-options-no-residue",
    "invoke applies transport hints to one call without changing the reference metadata.",
    async () => {
      const fn = reference((n: number) => n);
      const before = sf.getServerFunctionMetadata(fn);
      equal(await sf.invoke(fn, { priority: "low", keepalive: true }, 1), 1);
      equal(await fn(2), 2);
      equal(sf.getServerFunctionMetadata(fn), before);
    },
  );
}

if (isServer) {
  doc(
    "safe-error",
    "markSafeError preserves intentional Error properties while its registered-symbol brand is non-enumerable.",
    async () => {
      const error = markSafeError(
        Object.assign(new Error("intentional-message"), { code: "SAFE" }),
      );
      equal(isSafeError(error), true);
      equal(
        Object.getOwnPropertySymbols(error).filter(
          (s) => Object.getOwnPropertyDescriptor(error, s)?.enumerable,
        ).length,
        0,
      );
      const fn = reference(() => {
        throw error;
      });
      const response = await server.handleServerFunctionRequest(request(fn.id), {
        onError: () => {},
      });
      const decoded: any = await sf.decodeResponse(response).catch((e) => e);
      equal(decoded.message, "intentional-message");
      equal(decoded.code, "SAFE");
    },
  );
}

if (isServer) {
  // RFC 10 lines 63, 66, 78, 99, 129: exact public handler guarantees.
  doc(
    "registry-public",
    "Public integration registry lookup returns the registered original function.",
    () => {
      const fn = (n: number) => n + 1;
      server.registerServerFunction("docs-custom-dispatch", fn);
      equal(server.getServerFunction("docs-custom-dispatch"), fn);
      equal(server.getServerFunction("docs-custom-dispatch")(2), 3);
    },
  );
  doc(
    "request-standard-shape",
    "Body-size enforcement rebuilds a standards-only Request; the host restores platform data through locals.",
    async () => {
      const fn = reference(() => ({
        custom: (getRequestEvent()!.request as any).cf,
        region: (getRequestEvent()!.locals as any).region,
      }));
      const req = request(fn.id);
      (req as any).cf = { region: "host-region" };
      const response = await server.handleServerFunctionRequest(req, {
        bodySizeLimit: 1024,
        createEvent: (rebuilt) => {
          ok(rebuilt instanceof Request);
          equal(rebuilt.url, req.url);
          equal(rebuilt.method, "POST");
          equal(rebuilt.headers.get("origin"), "http://conformance.test");
          equal((rebuilt as any).cf, undefined);
          return { request: rebuilt, locals: { region: (req as any).cf.region } };
        },
      });
      equal(await sf.decodeResponse(response), { custom: undefined, region: "host-region" });
    },
  );
  doc(
    "not-modified-forward",
    "304 is not a followable redirect and forwards untouched on the scripted address.",
    async () => {
      const fn = reference(() => new Response(null, { status: 304 }));
      const response = await server.handleServerFunctionRequest(request(fn.id));
      equal(response.status, 304);
      equal(response.headers.has(sf.REDIRECT_HEADER), false);
    },
  );
  doc(
    "transform-direct-config",
    "transformDirectResult decorates in-process SSR calls without the HTTP transform path.",
    async () => {
      const fn = reference(() => 7);
      const ids: string[] = [];
      server.configureServerFunctionsServer({
        transformDirectResult: (value, context) => {
          ids.push(context.id);
          return Number(value) + 2;
        },
      });
      try {
        equal(await fn(), 9);
        equal(ids, [fn.id]);
      } finally {
        server.configureServerFunctionsServer({ transformDirectResult: (value) => value });
      }
    },
  );
  doc(
    "transform-flight-first-refusal",
    "The transformFlightResult seam sees the folded outcome and may claim its Response.",
    async () => {
      const fn = reference(() => 7);
      const req = request(fn.id);
      req.headers.set(sf.SINGLE_FLIGHT_HEADER, "true");
      let folded: any;
      const response = await server.handleServerFunctionRequest(req, {
        collectFlightData: () => ({ fresh: 8 }),
        transformFlightResult: (_event, value) => {
          folded = value;
          return new Response("claimed", {
            headers: { "x-claimed": "true", "X-Content-Raw": "true" },
          });
        },
      });
      equal(folded, { value: 7, data: { true: { fresh: 8 } } });
      equal(await response.text(), "claimed");
      equal(response.headers.get("x-claimed"), "true");
    },
  );
}

if (isServer) {
  doc(
    "get-url-refusals",
    "serverFunctionUrl refuses rich-codec arguments and URLs that would fall back to POST.",
    () => {
      const fn = sf.GET(reference(() => 7));
      throws(() => server.serverFunctionUrl(fn, new Date()));
      throws(() => server.serverFunctionUrl(fn, "x".repeat(10000)));
    },
  );
  doc(
    "live-data-url",
    "live(GET(fn)) exposes its distinct live address while inner GET retains its data address.",
    () => {
      const fn = sf.GET(reference(() => 7));
      const standing = server.live(fn);
      ok(server.serverFunctionUrl(standing, 3).includes("/live/" + fn.id));
      ok(server.serverFunctionUrl(fn, 3).includes("/data/" + fn.id));
    },
  );
  doc(
    "live-wire-framing",
    "The live address is SSE with no-store and X-Accel-Buffering:no; data remains codec framing.",
    async () => {
      const fn = sf.GET(
        reference(async function* () {
          yield 1;
          yield 2;
        }),
      );
      const liveRequest = new Request("http://conformance.test/_server/live/" + fn.id + "?args=[]");
      const response = await server.handleServerFunctionRequest(liveRequest);
      equal(response.headers.get("content-type"), "text/event-stream");
      equal(response.headers.get("cache-control"), "no-store");
      equal(response.headers.get("x-accel-buffering"), "no");
      const text = await response.text();
      ok(text.includes("data:"));
      ok(text.includes("id:"));
      const data = await server.handleServerFunctionRequest(
        new Request("http://conformance.test/_server/data/" + fn.id + "?args=[]"),
      );
      equal(data.headers.get("content-type")?.includes("text/event-stream"), false);
      const result: any = await sf.decodeResponse(data);
      const values: number[] = [];
      for await (const value of result) values.push(value);
      equal(values, [1, 2]);
    },
  );
  doc(
    "live-digest-skip",
    "Last-Event-ID digest suppresses only the matching first value, leaving subsequent values flowing.",
    async () => {
      const fn = sf.GET(
        reference(async function* () {
          yield 1;
          yield 2;
        }),
      );
      const url = "http://conformance.test/_server/live/" + fn.id + "?args=[]";
      const first = await server.handleServerFunctionRequest(new Request(url));
      const initial = await first.text();
      const digest = initial.match(/^id: (.+)$/m)?.[1];
      ok(digest);
      const response = await server.handleServerFunctionRequest(
        new Request(url, { headers: { "Last-Event-ID": digest! } }),
      );
      const replay = await response.text();
      equal((initial.match(/^id:/gm) ?? []).length, 2);
      equal((replay.match(/^id:/gm) ?? []).length, 1);
    },
  );
}

if(isServer){
 doc("reload-scopes", "reload returns no value and distinguishes host-default, named keys, explicit none and explicit all.",async()=>{
  for(const [init,header] of [[{},null],[{revalidate:"todos"},"todos"],[{revalidate:[]},""],[{revalidate:"*"},"*"]] as const){const response=reload(init as any);equal(response.headers.get("X-Revalidate"),header);equal(await response.text(),"");}
 });
 doc("live-inprocess-top-only-brand", "In-process live brands only a top-level iterable/component, never nested bounded sources.",async()=>{
  const generator=async function*(){yield 1;yield 2};const nested=generator();const promise=Promise.resolve(3);
  const obj=await sf.live(sf.GET(reference(()=>({nested,promise}))))();
  equal((obj as any)[Symbol.for("solid.LiveSource")],undefined);equal((obj.nested as any)[Symbol.for("solid.LiveSource")],undefined);equal((obj.promise as any)[Symbol.for("solid.LiveSource")],undefined);
  equal((await sf.live(sf.GET(reference(()=>generator())))() as any)[Symbol.for("solid.LiveSource")],true);
  const component=()=>"component";equal((await sf.live(sf.GET(reference(()=>component)))() as any)[Symbol.for("solid.LiveSource")],true);
 });
}
if(isServer){
 doc("live-nested-response-lifetime", "A live value answer holds the response until both a nested promise and bounded iterator end.",async()=>{
  let finishPromise!:(v:string)=>void,finishIterator!:()=>void,closed=0;
  const pending=new Promise<string>(r=>finishPromise=r),gate=new Promise<void>(r=>finishIterator=r);
  const fn=sf.GET(reference(()=>({meta:"nested-value",pending,progress:(async function*(){try{yield 1;await gate;yield 2}finally{closed++}})()})));
  const response=await server.handleServerFunctionRequest(new Request("http://conformance.test/_server/live/"+fn.id+"?args=[]"));
  let ended=false;const body=response.text().then(text=>{ended=true;return text});
  await new Promise(r=>setTimeout(r,5));equal(ended,false);equal(closed,0);
  finishPromise("resolved-promise");await new Promise(r=>setTimeout(r,5));equal(ended,false);equal(closed,0);
  finishIterator();const text=await body;equal(closed,1);ok(text.includes("nested-value"));ok(text.includes("resolved-promise"));ok(text.includes("data:"));
 });
}
if(isServer){
 doc("undeclared-promise-death", "A dying undeclared response rejects a nested pending promise and never invokes the source again.",async()=>{
  let finish!:(v:string)=>void,calls=0;const pending=new Promise<string>(r=>finish=r);
  const fn=sf.GET(reference(()=>{calls++;return {pending}}));
  const response=await server.handleServerFunctionRequest(new Request("http://conformance.test/_server/data/"+fn.id+"?args=[]"));
  const reader=response.body!.getReader();let cut!:(reason:Error)=>void;
  const faulty=new ReadableStream<Uint8Array>({start(controller){cut=e=>controller.error(e)},async pull(controller){const chunk=await reader.read();if(chunk.done)controller.close();else controller.enqueue(chunk.value)}});
  try{
   const value:any=await sf.decodeResponse(new Response(faulty,{headers:response.headers}));ok(value.pending instanceof Promise);
   const caught=value.pending.catch((e:any)=>e);cut(new Error("test-owned transport cut"));
   ok(await caught instanceof Error);equal(calls,1);
  }finally{finish("finished");void reader.cancel().catch(()=>{})}
 });
}
if(isServer){
 doc("codec-custom-public-edge", "A plugin authored from public serialization entry round-trips custom data and its OpaqueReference replacement through matching codec options.",async()=>{
  const {createPlugin,OpaqueReference}=await import("@solidjs/web/serialization");
  class Box{constructor(public value:number){}}
  const plugin=createPlugin<Box,{value:any}>({tag:"conformance/Box",test:value=>value instanceof Box,parse:{sync:(value,ctx)=>({value:ctx.parse(new OpaqueReference(()=>"private",value.value))}),stream:(value,ctx)=>({value:ctx.parse(new OpaqueReference(()=>"private",value.value))})},serialize:(node,ctx)=>"({value:"+ctx.serialize(node.value)+"})",deserialize:(node,ctx)=>new Box(ctx.deserialize<number>(node.value))});
  const fn=reference(()=>new Box(17));const response=await server.handleServerFunctionRequest(request(fn.id),{codec:{plugins:[plugin]}});
  const body:any=await sf.decodeResponse(response,{plugins:[plugin]});ok(body instanceof Box);equal(body.value,17);equal(Object.keys(body),["value"]);
 });
 doc("wrapper-error-intent", "wrapInvocation and transformResult error mappings pass safe/envelope intent but sanitize unbranded replacements.",async()=>{
  for(const hook of ["wrapInvocation","transformResult"] as const)for(const shape of ["safe","envelope","plain"] as const){
   const fn=reference(()=>{throw new Error("original secret")});const replacement=Object.assign(new Error("mapped intent"),{code:"INTENT"});
   const options:any={onError:()=>{}};
   if(hook==="wrapInvocation")options.wrapInvocation=()=>{throw shape==="envelope"?respond(replacement,{status:400}):shape==="safe"?markSafeError(replacement):replacement};
   else options.transformResult=()=>shape==="envelope"?respond(replacement,{status:400}):shape==="safe"?markSafeError(replacement):replacement;
   const response=await server.handleServerFunctionRequest(request(fn.id),options);const error:any=await sf.decodeResponse(response).catch(e=>e);
   equal(error.message,shape==="plain"&&!isDev?"Internal Server Error":"mapped intent");equal(error.code,shape==="plain"&&!isDev?undefined:"INTENT");
  }
 });
}
