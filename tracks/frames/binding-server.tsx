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
      "BINDING_SLOT_POSITION names " + reason + " at the server's invalid binding position.",
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
        const found = capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [];
        equal(found.length, isDev ? 1 : 0);
        if (isDev) {
          equal(found[0]!.kind, "ssr");
          equal(
            found[0]!.data?.reason,
            ["server-handler", "handler-tuple"].includes(reason) ? "server-local" : reason,
          );
          equal(found[0]!.severity, reason === "spread" ? "error" : "warn");
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
      equal(capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [], []);
      const html = chunks.find((c) => c.type === "html").html;
      for (const marker of ["_s:hidden", "_s:class", "_s:style", "_s:on:click", "_s:ref", "_s:t="])
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
        const events = capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [];
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
      equal(capture?.events.filter((e) => e.code === "BINDING_SLOT_POSITION") ?? [], []);
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
    registerServerReference("corrupt-slot", () => (p: any) => <main>{p.children}</main>),
  ),
);
export async function handle(request: Request) {
  const response = await handleServerFunctionRequest(request);
  if (!request.headers.has("x-omit-slot-record") && !request.headers.has("x-corrupt-markers"))
    return response;
  const reader = new ChunkReader(response.body!);
  const chunks: Uint8Array[] = [];
  for (let item = await reader.next(); !item.done; item = await reader.next()) {
    const chunk = JSON.parse(item.value);
    if (request.headers.has("x-omit-slot-record") && chunk.type === "slot") continue;
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
