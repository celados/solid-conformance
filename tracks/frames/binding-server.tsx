import { OBSERVE } from "solid-js";
import {
  isDev,
  ssr,
  ssrElement,
  ssrClassName,
  renderToString,
  createRequestEvent,
} from "@solidjs/web";
import { renderServerComponent } from "@solidjs/web/frames/server";
import { equal, ok, runCases, type DocCase } from "../docs/registry";
import { createJSONDeserializer } from "@solidjs/web/serialization";
const cases: DocCase[] = [];
const modes: Record<string, (p: any) => any> = {
  spread: (p) => <div {...p.row({ id: 1 })} />,
  stringified: (p) => {
    const row = p.row({});
    return <div class={"prefix-" + String(row.done)} />;
  },
  coerced: (p) => {
    const row = p.row({});
    return <span>{row.count + 1}</span>;
  },
  inline: (p) => {
    const row = p.row({});
    return ssr(['<div class="', '"></div>'], ssrClassName(row.done));
  },
  "server-handler": () => <button onClick={() => {}} />,
  "handler-tuple": () => <button onKeyDown={[() => {}, "data"]} />,
  tuple: (p) => {
    const row = p.row({});
    return <button onKeyDown={[row.key, 1]} />;
  },
  arg: (p) => {
    const row = p.row({});
    return <p.other nested={{ x: row.done }} />;
  },
  prop: (p) => {
    const row = p.row({});
    return ssrElement("input", { "prop:value": row.count }, undefined, true);
  },
};
for (const [reason, component] of Object.entries(modes))
  cases.push({
    id: "08/binding-server-" + reason,
    file: "08-dev-diagnostics.md",
    statement:
      "BINDING_SLOT_POSITION names " +
      reason +
      " at the server's invalid binding position.",
    async run() {
      const capture = OBSERVE?.diagnostics.capture();
      const errors: unknown[] = [];
      const messages: string[] = [];
      const old = [console.error, console.warn];
      console.error = console.warn = (...args) => {
        messages.push(args.map(String).join(" "));
      };
      try {
        const chunks: any[] = await renderServerComponent(component, {
          frame: { id: "binding-" + reason },
          onError: (e: unknown) => errors.push(e),
        } as any);
        const found =
          capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ??
          [];
        equal(found.length, isDev ? 1 : 0);
        if (isDev) {
          equal(found[0]!.kind, "ssr");
          equal(
            found[0]!.data?.reason,
            ["server-handler", "handler-tuple"].includes(reason)
              ? "server-local"
              : reason,
          );
          equal(found[0]!.severity, reason === "spread" ? "error" : "warn");
          if (
            ["stringified", "coerced", "inline", "tuple", "prop"].includes(
              reason,
            )
          ) {
            equal(found[0]!.data?.occurrence, "row#0");
            equal(
              found[0]!.data?.key,
              reason === "coerced" || reason === "prop"
                ? "count"
                : reason === "tuple"
                  ? "key"
                  : "done",
            );
          }
          if (reason === "prop") equal(found[0]!.data?.position, "prop:value");
        }
        if (isDev && reason === "spread")
          ok(errors.length || chunks.some((c) => c.type === "error"));
      } finally {
        capture?.stop();
        [console.error, console.warn] = old as any;
      }
    },
  });
cases.push({
  id: "08/binding-server-valid",
  file: "08-dev-diagnostics.md",
  statement:
    "Whole attributes/style/class/event/ref/text binding properties emit markers without positional warnings.",
  async run() {
    const capture = OBSERVE?.diagnostics.capture();
    try {
      const chunks: any[] = await renderServerComponent(
        (p: any) => {
          const row = p.row({ id: 1 });
          return (
            <button
              hidden={row.hidden}
              class={{ complete: row.done }}
              style={{ color: row.color }}
              onClick={row.click}
              ref={row.ref}
            >
              {row.count}
            </button>
          );
        },
        { frame: { id: "valid" } },
      );
      equal(
        capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [],
        [],
      );
      const html = chunks.find((c) => c.type === "html").html;
      for (const marker of [
        "_s:hidden",
        "_s:class",
        "_s:style",
        "_s:on:click",
        "_s:ref",
        "_s:t=",
      ])
        ok(html.includes(marker), "Missing binding marker " + marker);
    } finally {
      capture?.stop();
    }
  },
});
export const run = () =>
  (globalThis as any)[RequestContext].run(
    createRequestEvent(new Request("http://localhost/")),
    () => runCases(cases),
  );

import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "@solidjs/web";
import {
  configureServerFunctionsServer,
  createServerReference,
  registerServerReference,
  handleServerFunctionRequest,
  GET,
  ChunkReader,
  createChunk,
} from "@solidjs/web/server-functions/server";
import {
  frameTransformResult,
  frameTransformDirectResult,
  ServerComponentPlugin,
} from "@solidjs/web/frames/server";
(globalThis as any)[RequestContext] ??= new AsyncLocalStorage();
configureServerFunctionsServer({
  transformResult: frameTransformResult,
  transformDirectResult: frameTransformDirectResult,
});
for (const reason of ["markup", "reserved-key"] as const)
  cases.push({
    id: "08/binding-document-" + reason,
    file: "08-dev-diagnostics.md",
    statement:
      "The SSR document face classifies a client fill and reports " +
      reason +
      " without leaking a server value.",
    async run() {
      const id = "binding-doc-" + reason;
      const C = frameTransformDirectResult(
        (p: any) => {
          const row = p.row({});
          return <button class={row.done}>{row.title}</button>;
        },
        { id },
      );
      const capture = OBSERVE?.diagnostics.capture();
      const previous = console.warn;
      console.warn = () => {};
      try {
        const html = renderToString(() => (
          <C
            row={
              reason === "markup"
                ? () => <b>markup</b>
                : () => ({ title: "valid", done: true, $bad: "reserved" })
            }
          />
        ));
        const events =
          capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ??
          [];
        if (isDev) {
          ok(events.length > 0);
          for (const e of events) {
            equal(e.kind, "ssr");
            equal(e.severity, "warn");
            equal(e.data?.reason, reason);
          }
        } else equal(events, []);
        if (reason === "reserved-key") ok(html.includes("valid"));
      } finally {
        capture?.stop();
        console.warn = previous;
      }
    },
  });
cases.push({
  id: "08/binding-truthiness-and-source-order",
  file: "08-dev-diagnostics.md",
  statement:
    "Truthiness has no runtime warning; a later spread owning an event position leaves the earlier local handler unread.",
  async run() {
    const capture = OBSERVE?.diagnostics.capture();
    try {
      const chunks: any[] = await renderServerComponent(
        (p: any) => {
          const row = p.row({});
          return (
            <section>
              <b>{row.done ? "always-truthy" : "false"}</b>
              <button onClick={() => {}} {...({ onClick: undefined } as any)} />
            </section>
          );
        },
        { frame: { id: "truthy-and-override" } },
      );
      equal(
        capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [],
        [],
      );
      ok(chunks.find((c) => c.type === "html").html.includes("always-truthy"));
    } finally {
      capture?.stop();
    }
  },
});
GET(
  createServerReference(
    registerServerReference("binding-client", (shape: string) => (p: any) => {
      const row = p.row({ id: shape });
      return (
        <button hidden={row.hidden} onClick={row.click}>
          {row.title}
        </button>
      );
    }),
  ),
);
GET(
  createServerReference(
    registerServerReference("corrupt-slot", () => (p: any) => (
      <main>{p.children}</main>
    )),
  ),
);
export async function handle(request: Request) {
  const response = await handleServerFunctionRequest(request);
  if (
    !request.headers.has("x-omit-slot-record") &&
    !request.headers.has("x-corrupt-markers")
  )
    return response;
  const reader = new ChunkReader(response.body!);
  const chunks: Uint8Array[] = [];
  for (let item = await reader.next(); !item.done; item = await reader.next()) {
    const chunk = JSON.parse(item.value);
    if (request.headers.has("x-omit-slot-record") && chunk.type === "slot")
      continue;
    if (request.headers.has("x-corrupt-markers") && chunk.type === "html")
      chunk.html = chunk.html.replace(/<!--slot:children:end-->/g, "");
    chunks.push(createChunk(JSON.stringify(chunk)));
  }
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
    { status: response.status, headers: response.headers },
  );
}

cases.push({
  id: "08/binding-reserved-key-set",
  file: "08-dev-diagnostics.md",
  statement:
    "The explicit reserved range keys warn individually while ordinary filter/map data keys remain readable.",
  run() {
    const keys = [
      "$bad",
      "0bad",
      "length",
      "slice",
      "t",
      "h",
      "p",
      "then",
      "constructor",
      "toString",
      "valueOf",
      "toJSON",
    ];
    const C = frameTransformDirectResult(
      (p: any) => {
        const row = p.row({});
        return (
          <b>
            {row.filter}:{row.map}
          </b>
        );
      },
      { id: "reserved-set" },
    );
    const capture = OBSERVE?.diagnostics.capture();
    const old = console.warn;
    console.warn = () => {};
    try {
      const values = Object.fromEntries(keys.map((k) => [k, "reserved"]));
      const html = renderToString(() => (
        <C
          row={() => ({ ...values, filter: "filter-value", map: "map-value" })}
        />
      ));
      ok(html.includes("filter-value"));
      ok(html.includes("map-value"));
      const events =
        capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [];
      equal(events.length, isDev ? keys.length : 0);
      if (isDev) {
        equal(
          events.map((e) => e.data?.key),
          keys,
        );
        for (const e of events) {
          equal(e.kind, "ssr");
          equal(e.severity, "warn");
          equal(e.data?.reason, "reserved-key");
          equal(e.data?.occurrence, "row#0");
        }
      }
    } finally {
      capture?.stop();
      console.warn = old;
    }
  },
});
cases.push({
  id: "08/binding-nested-arg-first-path",
  file: "08-dev-diagnostics.md",
  statement:
    "Nested plain-object/array stand-ins are scrubbed to undefined on stream and document faces, reported once at first path with origin fields.",
  async run() {
    const component = (p: any) => {
      const row = p.row({});
      const value = row.done;
      return <p.child payload={{ first: { x: value }, second: [value] }} />;
    };
    const capture = OBSERVE?.diagnostics.capture();
    const old = console.warn;
    console.warn = () => {};
    try {
      const chunks: any[] = await renderServerComponent(component, {
        frame: { id: "nested-arg" },
      });
      const reference = chunks.find(
        (c) => c.type === "slot" && c.key === "child#0",
      ).args.payload;
      const arg: any = createJSONDeserializer()(
        chunks.find((c) => c.type === "data" && c.key === reference.$ref).node,
      );
      equal(arg.first.x, undefined);
      equal(arg.second[0], undefined);
      const streamEvents =
        capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [];
      equal(streamEvents.length, isDev ? 1 : 0);
      if (isDev) {
        const e = streamEvents[0]!;
        equal(e.kind, "ssr");
        equal(e.severity, "warn");
        equal(e.data, {
          reason: "arg",
          occurrence: "child#0",
          key: "payload",
          path: ".first.x",
          from: "row#0",
          fromKey: "done",
        });
      }
      const C = frameTransformDirectResult(component, { id: "nested-doc" });
      let received: any;
      renderToString(() => (
        <C
          row={() => ({ done: 42 })}
          child={(p: any) => {
            received = p.payload;
            return "child";
          }}
        />
      ));
      ok(received);
      equal(received.first.x, undefined);
      equal(received.second[0], undefined);
      const all =
        capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [];
      equal(all.length, isDev ? 2 : 0);
      if (isDev) equal(all[1]!.data, streamEvents[0]!.data);
    } finally {
      capture?.stop();
      console.warn = old;
    }
  },
});
export async function nonPlainArguments() {
  return (globalThis as any)[RequestContext].run(
    createRequestEvent(new Request("http://localhost/nonplain")),
    async () => {
      const rows: any[] = [];
      for (const kind of ["map", "set", "class"]) {
        const capture = OBSERVE?.diagnostics.capture();
        const old = console.warn;
        console.warn = () => {};
        let expected: any, received: any;
        class Box {
          constructor(public value: any) {}
        }
        const component = (p: any) => {
          const value = p.row({}).done;
          const container =
            kind === "map"
              ? new Map([["value", value]])
              : kind === "set"
                ? new Set([value])
                : new Box(value);
          expected = container;
          return <p.child container={container} />;
        };
        try {
          const abort = new AbortController();
          const pending = renderServerComponent(component, {
            frame: { id: "arg-nonplain-" + kind },
            signal: abort.signal,
            onError() {},
          });
          pending.pipe({ write() {}, end() {} });
          Promise.resolve(pending).catch(() => {});
          await new Promise((r) => setTimeout(r, 10));
          ok(expected !== undefined);
          equal(
            capture?.events.filter(
              (e) =>
                e.code === "BINDING_SLOT_POSITION" && e.data?.reason === "arg",
            ) ?? [],
            [],
          );
          abort.abort();
          const C = frameTransformDirectResult(component, {
            id: "arg-nonplain-doc-" + kind,
          });
          let unsupported: unknown;
          try {
            renderToString(() => (
              <C
                row={() => ({ done: "client-value" })}
                child={(p: any) => {
                  received = p.container;
                  return "child";
                }}
              />
            ));
          } catch (error) {
            unsupported = error;
          }
          if (kind === "class") {
            ok(unsupported instanceof Error);
            if (isDev)
              ok(String(unsupported).includes("cannot be parsed/serialized"));
          } else {
            ok(received === expected);
            const value =
              kind === "map" ? received.get("value") : [...received][0];
            ok(value !== undefined);
          }
          equal(
            capture?.events.filter(
              (e) =>
                e.code === "BINDING_SLOT_POSITION" && e.data?.reason === "arg",
            ) ?? [],
            [],
          );
          rows.push({
            kind,
            documentIdentity: kind !== "class",
            standInNotUndefined: kind !== "class",
            classSerialization:
              kind === "class"
                ? "default codec explicitly rejects unsupported class"
                : undefined,
            argDiagnostics: 0,
            codecCompletion:
              "not-asserted: opaque container holds unwalked stand-in; collection does not converge",
          });
        } finally {
          capture?.stop();
          console.warn = old;
        }
      }
      return rows;
    },
  );
}
cases.push({
  id: "08/binding-arg-nonplain-not-walked",
  file: "08-dev-diagnostics.md",
  statement:
    "Argument scrubbing visits plain objects and arrays only; Map, Set and class instances are not visited on either face.",
  async run() {
    const script = `const m=await import(${JSON.stringify(import.meta.url)});const rows=await m.nonPlainArguments();console.log("@@NONPLAIN@@"+JSON.stringify(rows));process.exit(0)`;
    const child = Bun.spawn(["bun", "-e", script], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = new Response(child.stdout).text(),
      stderr = new Response(child.stderr).text();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const code = await Promise.race([
        child.exited,
        new Promise<number>(
          (_r, j) =>
            (timer = setTimeout(
              () => j(new Error("nonplain isolated public render exceeded 5s")),
              5000,
            )),
        ),
      ]);
      ok(code === 0, await stderr);
      const output = await stdout;
      const marker = output
        .split("\n")
        .find((line) => line.startsWith("@@NONPLAIN@@"));
      ok(marker, output + (await stderr));
      const rows = JSON.parse(marker!.slice("@@NONPLAIN@@".length));
      equal(
        rows.map((r: any) => r.kind),
        ["map", "set", "class"],
      );
      await Bun.write(
        "artifacts/binding-nonplain-" +
          (isDev ? "development" : OBSERVE ? "observe" : "production") +
          ".json",
        JSON.stringify(rows, null, 2),
      );
    } finally {
      if (timer) clearTimeout(timer);
      if (child.exitCode === null) child.kill();
      await child.exited;
    }
  },
});
cases.push({
  id: "08/binding-coercion-both-faces-empty",
  file: "08-dev-diagnostics.md",
  statement:
    "Stringified/coerced/inline stand-ins never display the document fill value, matching the stream face.",
  async run() {
    for (const reason of ["stringified", "coerced", "inline"]) {
      const capture = OBSERVE?.diagnostics.capture();
      const old = console.warn;
      console.warn = () => {};
      try {
        const component = modes[reason]!;
        const chunks: any[] = await renderServerComponent(component, {
          frame: { id: "empty-" + reason },
        });
        const C = frameTransformDirectResult(component, {
          id: "empty-doc-" + reason,
        });
        const html = renderToString(() => (
          <C row={() => ({ done: "MUST_NOT_RENDER", count: 7331 })} />
        ));
        ok(!html.includes("MUST_NOT_RENDER"));
        ok(!html.includes("7332"));
        const stream = chunks
          .filter((c) => c.type === "html")
          .map((c) => c.html)
          .join("");
        ok(!stream.includes("MUST_NOT_RENDER"));
        ok(!stream.includes("7332"));
        const events =
          capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ??
          [];
        equal(events.length, isDev ? 2 : 0);
        for (const event of events) {
          equal(event.kind, "ssr");
          equal(event.severity, "warn");
          equal(event.data?.reason, reason);
        }
      } finally {
        capture?.stop();
        console.warn = old;
      }
    }
  },
});
