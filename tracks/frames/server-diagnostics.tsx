import { OBSERVE, Loading, Errored, createMemo } from "solid-js";
import {
  isDev,
  renderToStream,
  dynamic,
  markSafeError,
  RequestContext,
  createRequestEvent,
} from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  registerServerReference,
  createServerReference,
  handleServerFunctionRequest,
  decodeResponse,
} from "@solidjs/web/server-functions/server";
import { renderServerComponent } from "@solidjs/web/frames/server";
import { equal, ok, type DocCase, runCases } from "../docs/registry";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
const cases: DocCase[] = [];
const doc = (id: string, statement: string, run: DocCase["run"]) =>
  cases.push({ id: "08/server-road-" + id, file: "08-dev-diagnostics.md", statement, run });
async function observed(run: () => unknown | Promise<unknown>) {
  const session = OBSERVE?.diagnostics.capture();
  const messages: string[] = [];
  const previous = [console.warn, console.error, console.info];
  console.warn =
    console.error =
    console.info =
      (...args) => {
        messages.push(args.map(String).join(" "));
      };
  try {
    await run();
    await new Promise((r) => setTimeout(r, 10));
    return { events: session?.events.slice() ?? [], messages };
  } finally {
    session?.stop();
    [console.warn, console.error, console.info] = previous as any;
  }
}
const selected = (result: Awaited<ReturnType<typeof observed>>, code: string) =>
  result.events.filter((e) => e.code === code);
function assertFinding(result: Awaited<ReturnType<typeof observed>>, code: string, count = 1) {
  const events = selected(result, code);
  equal(events.length, OBSERVE ? count : 0);
  return events;
}

// RFC 08 L581: handling=fallback, original thrown value, thrown/met owner paths.
doc(
  "contained-fallback",
  "Errored contains a server throw; data.error retains its identity and handling names fallback.",
  async () => {
    const original = new Error("private-contained");
    let html = "";
    function Broken(): never {
      throw original;
    }
    const result = await observed(async () => {
      html = await renderToStream(
        () => (
          <Errored fallback={() => <b>handled</b>}>
            <Broken />
          </Errored>
        ),
        { onError: () => {} },
      );
    });
    ok(html.includes("handled"));
    const events = assertFinding(result, "SSR_RENDER_ERROR_CONTAINED");
    if (OBSERVE) {
      equal(events[0]!.data?.handling, "fallback");
      equal(events[0]!.data?.error, original);
      equal(events[0]!.severity, "error");
    }
    equal(
      result.messages.some((m) => m.includes("SSR_RENDER_ERROR_CONTAINED")),
      isDev,
    );
  },
);
doc(
  "contained-client",
  "A post-shell Loading rejection names handling:client, the boundary id, and the original throw.",
  async () => {
    let reject!: (reason: unknown) => void;
    const original = new Error("private-fragment");
    const pending = new Promise<string>((_r, j) => {
      reject = j;
    });
    function Pending() {
      const value = createMemo(() => pending);
      return <span>{value()}</span>;
    }
    const result = await observed(async () => {
      const stream = renderToStream(
        () => (
          <Loading fallback="loading">
            <Pending />
          </Loading>
        ),
        { onError: () => {} },
      );
      stream.pipe({ write() {}, end() {} });
      await new Promise((r) => setTimeout(r, 5));
      reject(original);
      await stream;
    });
    const events = assertFinding(result, "SSR_RENDER_ERROR_CONTAINED");
    if (OBSERVE) {
      equal(events[0]!.data?.handling, "client");
      equal(events[0]!.data?.error, original);
      ok(events[0]!.data?.boundary);
    }
    assertFinding(result, "SSR_SUBTREE_ABANDONED", 0);
  },
);
// Initial-pass structured record is the isolated red oracle in finding 017.
// The hook's failed routing remains a passing public-policy contract.
doc(
  "initial-failed-hook",
  "Initial synchronous failure is reported as render/failed before it is rethrown to the caller.",
  async () => {
    const original = new Error("private-root");
    const reports: any[] = [];
    let thrown: unknown;
    await observed(() => {
      try {
        renderToStream(
          () => {
            throw original;
          },
          { onError: (error, site) => reports.push([error, site.kind, site.handling]) },
        );
      } catch (error) {
        thrown = error;
      }
    });
    equal(thrown, original);
    equal(reports, [[original, "render", "failed"]]);
  },
);
for (const reason of ["consumer", "sink", "signal"] as const) {
  doc(
    "abandoned-" + reason,
    "A pending response abandoned by " +
      reason +
      " reports reason, shellFlushed and pendingFragments without ownerPath.",
    async () => {
      function Pending() {
        const value = createMemo(() => new Promise<string>(() => {}));
        return <span>{value()}</span>;
      }
      const controller = new AbortController();
      const result = await observed(async () => {
        const stream = renderToStream(
          () => (
            <Loading fallback="loading">
              <Pending />
            </Loading>
          ),
          { signal: controller.signal, onError: () => {} },
        );
        if (reason === "consumer") {
          const reader = stream.readable.getReader();
          await reader.read();
          await reader.cancel();
        } else if (reason === "signal") {
          const reader = stream.readable.getReader();
          await reader.read();
          controller.abort();
          await reader.cancel();
        } else {
          stream.pipe({
            write() {
              throw new Error("sink unavailable");
            },
            end() {},
          });
          await new Promise((r) => setTimeout(r, 10));
        }
      });
      const events = assertFinding(result, "SSR_STREAM_ABANDONED");
      if (OBSERVE) {
        equal(events[0]!.data?.reason, reason);
        equal(events[0]!.data?.shellFlushed, reason !== "sink");
        equal(events[0]!.data?.pendingFragments, 1);
        equal(events[0]!.ownerPath, undefined);
        equal(events[0]!.severity, "warn");
      }
    },
  );
}
doc(
  "clean-render",
  "A successful completed render has no containment or abandonment findings.",
  async () => {
    const result = await observed(async () => {
      await renderToStream(() => (
        <Loading fallback="loading">
          <span>ready</span>
        </Loading>
      ));
    });
    for (const code of [
      "SSR_RENDER_ERROR_CONTAINED",
      "SSR_SUBTREE_ABANDONED",
      "SSR_STREAM_ABANDONED",
      "SERVER_ERROR_SANITIZED",
    ])
      assertFinding(result, code, 0);
  },
);
doc(
  "dynamic-client-function",
  "An async dynamic source landing on a client component rejects in every tier and identifies the function.",
  async () => {
    function ClientOnly() {
      return <b />;
    }
    let errors: unknown[] = [];
    const C = dynamic(() => Promise.resolve(ClientOnly));
    const result = await observed(async () => {
      await renderToStream(
        () => (
          <Loading fallback="loading">
            <C />
          </Loading>
        ),
        { onError: (e) => errors.push(e) },
      );
    });
    const events = assertFinding(result, "DYNAMIC_ASYNC_COMPONENT");
    if (OBSERVE) {
      equal(events[0]!.data?.component, "ClientOnly");
      equal(events[0]!.ownerPath, undefined);
    }
    ok(errors.some((e) => String(e).includes("DYNAMIC_ASYNC_COMPONENT")));
  },
);
doc(
  "dynamic-safe-values",
  "Sync component functions and async tag names never trigger DYNAMIC_ASYNC_COMPONENT.",
  async () => {
    function Sync() {
      return <b>sync</b>;
    }
    const S = dynamic(() => Sync);
    const Tag = dynamic(() => Promise.resolve("div"));
    const result = await observed(async () => {
      await renderToStream(() => (
        <Loading fallback="loading">
          <S />
          <Tag>async-tag</Tag>
        </Loading>
      ));
    });
    assertFinding(result, "DYNAMIC_ASYNC_COMPONENT", 0);
  },
);
for (const safe of [false, true]) {
  doc(
    "sanitize-rpc-" + safe,
    "Server-function wire sanitization preserves safe errors and records originals only in non-dev observe builds.",
    async () => {
      const original = Object.assign(new TypeError("private-database"), { secret: "private-key" });
      if (safe) markSafeError(original);
      const id = "road-rpc-" + safe;
      registerServerReference(id, () => {
        throw original;
      });
      let wire: any;
      const result = await observed(async () => {
        const response = await handleServerFunctionRequest(
          new Request("http://test/_server/data/" + id, {
            method: "POST",
            body: "[]",
            headers: {
              origin: "http://test",
              "content-type": "application/json",
              "X-Server-Function-Format": "8",
            },
          }),
          { onError: () => {} },
        );
        wire = await decodeResponse(response).catch((e) => e);
      });
      equal(wire.message, safe || isDev ? "private-database" : "Internal Server Error");
      const events = selected(result, "SERVER_ERROR_SANITIZED");
      equal(events.length, OBSERVE && !isDev && !safe ? 1 : 0);
      if (events.length) {
        equal(events[0]!.severity, "error");
        equal(events[0]!.data?.source, "server-function");
        equal(events[0]!.data?.error, original);
        equal((events[0]!.data?.wire as Error).message, "Internal Server Error");
      }
      equal(
        result.messages.some((m) => m.includes("SERVER_ERROR_SANITIZED")),
        false,
      );
    },
  );
  doc(
    "sanitize-ssr-" + safe,
    "Errored sanitizes before fallback rendering; serialized fallback agrees with wire and safe errors are unreported.",
    async () => {
      const original = new Error("private-render");
      if (safe) markSafeError(original);
      let text = "";
      function Broken(): never {
        throw original;
      }
      const result = await observed(async () => {
        text = await renderToStream(
          () => (
            <Errored fallback={(error) => <b>{String(error())}</b>}>
              <Broken />
            </Errored>
          ),
          { onError: () => {} },
        );
      });
      ok(text.includes(safe || isDev ? "private-render" : "Internal Server Error"));
      if (!safe && !isDev) equal(text.includes("private-render"), false);
      const events = selected(result, "SERVER_ERROR_SANITIZED");
      equal(events.length, OBSERVE && !isDev && !safe ? 1 : 0);
      if (events.length) {
        equal(events[0]!.severity, "info");
        equal(events[0]!.data?.source, "ssr");
        equal(events[0]!.data?.error, original);
      }
    },
  );
}
doc(
  "error-value-data",
  "An Error used as data rather than thrown preserves its authored properties without sanitization.",
  async () => {
    const original = new Error("authored-data");
    const fn = createServerReference(registerServerReference("error-as-data", () => original));
    const result = await observed(async () => {
      const response = await handleServerFunctionRequest(
        new Request("http://test/_server/data/error-as-data", {
          method: "POST",
          body: "[]",
          headers: {
            origin: "http://test",
            "content-type": "application/json",
            "X-Server-Function-Format": "8",
          },
        }),
      );
      const value: any = await decodeResponse(response);
      equal(value.message, "authored-data");
    });
    assertFinding(result, "SERVER_ERROR_SANITIZED", 0);
  },
);
export const run = () =>
  scope.run(createRequestEvent(new Request("http://test/")), () => runCases(cases));
