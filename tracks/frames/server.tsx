import { Loading, createMemo } from "solid-js";
import {
  dynamic,
  renderToStream,
  HydrationScript,
  NoHydration,
  Hydration,
  getRequestEvent,
  RequestContext,
  createRequestEvent,
} from "@solidjs/web";
import {
  configureServerFunctionsServer,
  registerServerReference,
  createServerReference,
  handleServerFunctionRequest,
  GET,
  registerFlightDataSource,
} from "@solidjs/web/server-functions/server";
import {
  frameTransformResult,
  frameTransformDirectResult,
  frameTransformFlightResult,
  ServerComponentPlugin,
  SERVER_COMPONENT_BOOTSTRAP,
  renderServerComponent,
  asyncArg,
} from "@solidjs/web/frames/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { Counter } from "./counter";
import { runCases } from "../docs/registry";
import { rpcCases } from "../docs/rpc-cases";
import { frameCases } from "../docs/frame-cases";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
configureServerFunctionsServer({
  transformResult: frameTransformResult,
  transformDirectResult: frameTransformDirectResult,
  transformFlightResult: frameTransformFlightResult,
});
export let generation = 0;
export const invocations: string[] = [];
export function advance() {
  generation++;
}
export function reset() {
  generation = 0;
  invocations.length = 0;
}
export const story = GET(
  createServerReference(
    registerServerReference("wave3-story", (id: number) => {
      invocations.push("story:" + id);
      const current = generation;
      return (props: any) => (
        <article data-story={id}>
          <h1>
            story-{id}-generation-{current}
          </h1>
          <props.counter $key="counter" cid={id}>
            <p>nested-server-text-{id}</p>
          </props.counter>
          <footer>{props.children}</footer>
        </article>
      );
    }),
  ),
);
registerServerReference("wave3-asyncarg", () => (p: any) => (
  <main>
    <p.status
      progress={asyncArg(new Promise<string>((r) => setTimeout(() => r("async-slot-value"), 30)))}
    />
  </main>
));
registerServerReference("wave3-asyncarg-fail", () => (p: any) => (
  <main>
    <p.status
      progress={asyncArg(
        new Promise<string>((_r, reject) =>
          setTimeout(() => reject(new Error("private-slot-error")), 30),
        ),
      )}
    />
  </main>
));
registerServerReference("wave3-echo", (...args: any[]) => ({
  args,
  authorization: getRequestEvent()?.request.headers.get("authorization"),
}));
GET(createServerReference(registerServerReference("wave3-read", (n: number) => n + 1)));
registerServerReference("wave3-body", async (body: Blob) => ({
  text: await body.text(),
  name: body instanceof File ? body.name : null,
}));
registerServerReference("wave3-fail", () => {
  throw new Error("private-rpc-error");
});
registerServerReference("wave3-late", async () => {
  await new Promise((r) => setTimeout(r, 300));
  return 7;
});
registerServerReference("wave3-mutate", () => {
  generation++;
  return generation;
});
registerFlightDataSource("cache", () => ({ fresh: generation }));
registerFlightDataSource("frames", () => ({
  story: frameTransformDirectResult(
    (p: any) => (
      <article data-story={1}>
        <h1>story-1-generation-{generation}</h1>
        <p.counter $key="counter" cid={1}>
          <p>nested-server-text-1</p>
        </p.counter>
        <footer>{p.children}</footer>
      </article>
    ),
    { id: "wave3-story", args: [1] },
  ),
}));
export const liveStats = { opened: 0, closed: 0 };
GET(
  createServerReference(
    registerServerReference("wave3-live", async function* () {
      const signal = getRequestEvent()!.request.signal;
      const id = ++liveStats.opened;
      try {
        await new Promise((r) => setTimeout(r, 30));
        yield id;
        await new Promise<void>((r) => {
          if (signal.aborted) r();
          else signal.addEventListener("abort", () => r(), { once: true });
        });
      } finally {
        liveStats.closed++;
      }
    }),
  ),
);
export function handle(request: Request) {
  return handleServerFunctionRequest(request, { onError: () => {} });
}
export function documentStream() {
  return scope.run(createRequestEvent(new Request("http://localhost/")), () =>
    renderToStream(
      () => {
        const Story = dynamic(() => story(1) as any);
        return (
          <NoHydration>
            <html>
              <head>
                <HydrationScript />
                <script innerHTML={SERVER_COMPONENT_BOOTSTRAP} />
              </head>
              <body>
                <div id="root">
                  <Hydration id="frames">
                    <Loading fallback="loading">
                      <Story counter={Counter}>
                        <small>client-footer</small>
                      </Story>
                    </Loading>
                  </Hydration>
                </div>
                <script type="module" async src="/client.js" />
              </body>
            </html>
          </NoHydration>
        );
      },
      { plugins: [ServerComponentPlugin], onError: () => {} },
    ),
  );
}
export async function documents() {
  try {
    return await scope.run(createRequestEvent(new Request("http://localhost/")), () =>
      runCases([...rpcCases, ...frameCases]),
    );
  } finally {
    configureServerFunctionsServer({
      transformResult: frameTransformResult,
      transformDirectResult: frameTransformDirectResult,
      transformFlightResult: frameTransformFlightResult,
    });
  }
}
