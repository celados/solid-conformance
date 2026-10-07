import { Counter } from "./counter";
import { createSignal, Loading, Errored, flush } from "solid-js";
import { dynamic, render, hydrate } from "@solidjs/web";
import { installServerComponents } from "@solidjs/web/frames";
import {
  createServerReference,
  configureServerFunctionsClient,
  GET,
  withMeta,
  invoke,
  subscribeFlightData,
  live,
} from "@solidjs/web/server-functions/client";
import { enableRichArguments } from "@solidjs/web/server-functions/rich-args";
installServerComponents();
const requests: { address: string; method?: string; headers: any }[] = [];
const hooks: any[] = [];
configureServerFunctionsClient({
  fetch: (address, init) => {
    requests.push({
      address,
      method: init.method,
      headers: Object.fromEntries(new Headers(init.headers)),
    });
    return fetch(address, init);
  },
  prepareRequest: (init, context) => {
    hooks.push({ id: context.id, meta: context.meta });
    const headers = new Headers(init.headers);
    headers.set("authorization", "Bearer wave3");
    return { ...init, headers };
  },
});
const [id, setId] = createSignal(1);
const [version, setVersion] = createSignal(0);
let mounts = 0;
let disposals = 0;
const story = GET(createServerReference("wave3-story"));
const Story = dynamic(() => {
  version();
  return story(id()) as any;
});

function App() {
  return (
    <Loading fallback="loading">
      <Story counter={Counter}>
        <small>client-footer</small>
      </Story>
    </Loading>
  );
}
const root = document.getElementById("root")!;
const dispose = location.search.includes("hydrate")
  ? hydrate(App, root, { renderId: "frames" })
  : render(App, root);
const pause = async () => {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10));
    flush();
  }
};
const liveValues: number[] = [];
const liveStatus: string[] = [];
let liveIterator: AsyncIterator<number> | undefined;
async function startLive() {
  const source = live(GET(createServerReference("wave3-live")))() as any;
  source.onstatus = (status: string) => liveStatus.push(status);
  liveIterator = source[Symbol.asyncIterator]();
  void (async () => {
    for (let next = await liveIterator!.next(); !next.done; next = await liveIterator!.next()) {
      liveValues.push(next.value);
      await liveIterator!.return!();
      break;
    }
  })().catch((error) => liveStatus.push("error:" + String(error)));
}
(window as any).framesHarness = {
  startLive,
  liveValues,
  liveStatus,
  stopLive: async () => {
    await liveIterator!.return!();
    installServerComponents();
  },
  requests,
  hooks,
  pause,
  mounts: () => mounts,
  change: (next: number) => {
    setId(next);
    flush();
  },
  refetch: () => {
    setVersion((n) => n + 1);
    flush();
  },
  unmount: () => {
    dispose();
    flush();
    disposals++;
  },
  disposals: () => disposals,
  async asyncSlots() {
    const results: any[] = [];
    for (const reference of ["wave3-asyncarg", "wave3-asyncarg-fail"]) {
      const target = document.createElement("div");
      document.body.appendChild(target);
      const C = dynamic(() => createServerReference(reference)() as any);
      let errors = 0;
      const close = render(
        () => (
          <Errored
            fallback={(error) => {
              errors++;
              return <b>{String(error())}</b>;
            }}
          >
            <Loading fallback="slot-pending">
              <C status={(p: any) => <em>{p.progress}</em>} />
            </Loading>
          </Errored>
        ),
        target,
      );
      await pause();
      results.push({ reference, text: target.textContent, errors });
      close();
      target.remove();
    }
    return results;
  },
  async rpc() {
    const echo = createServerReference("wave3-echo");
    const read = GET(createServerReference("wave3-read"));
    const plain = await echo("plain");
    const natural = await echo(new URLSearchParams({ title: "natural" }));
    const get = await read(4);
    const richError = await echo(new Date()).then(
      () => null,
      (e) => String(e),
    );
    enableRichArguments();
    const rich = await echo(new Date("2020-01-01"), new Map([["n", 1]]));
    const decorated = withMeta(echo, { requiresAuth: true });
    await decorated(9);
    const unknown = await createServerReference("unknown-wave3")().then(
      () => null,
      (e) => ({ message: e.message, unknown: e.unknownFunction }),
    );
    const failure = await createServerReference("wave3-fail")().then(
      () => null,
      (e) => e.message,
    );
    const controller = new AbortController();
    const late = invoke(
      createServerReference("wave3-late"),
      { signal: controller.signal, priority: "low" },
      1,
    ).catch((e) => e.name);
    controller.abort();
    const abort = await late;
    const delivery: any[] = [];
    const offCache = subscribeFlightData("cache", async (slice) => {
      await new Promise((r) => setTimeout(r, 5));
      delivery.push(["cache", slice]);
    });
    const offFrames = subscribeFlightData("frames", (slice) => {
      delivery.push(["frames", typeof (slice as any).story]);
    });
    const flight = await createServerReference("wave3-mutate")();
    delivery.push(["returned", flight]);
    offCache();
    offFrames();
    return {
      flight,
      delivery,
      plain,
      natural,
      get,
      richError,
      richDate: rich.args[0] instanceof Date,
      richMap: rich.args[1] instanceof Map,
      unknown,
      failure,
      abort,
    };
  },
};
