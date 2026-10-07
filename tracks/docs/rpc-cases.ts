import {
  isServer,
  isDev,
  getRequestEvent,
  redirect,
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
