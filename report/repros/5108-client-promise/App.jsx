import { Show, Loading, createMemo, createSignal, latest, onSettled } from "solid-js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// A live source branded the way @solidjs/router's liveQuery brands one: the server
// serializes its first value; after hydration the browser re-runs the compute, and
// this one answers `ms` later and stays open.
async function* gen(value, ms) {
  if (typeof window !== "undefined") await sleep(ms);
  yield value;
  await new Promise(() => {});
}
function live(value, ms) {
  const it = gen(value, ms);
  it[Symbol.for("solid.LiveSource")] = true;
  return it;
}

export function App() {
  const list = createMemo(() => live(["a"], 200));
  const id = createMemo(() => latest(list)?.[0]);
  // Server-rendered, keyed on `id`.
  const overview = createMemo(() => (id() ? live(5, 100) : undefined));
  // Browser-only and slow, keyed on `id`: answers 1 s after it is asked.
  const inbox = createMemo(() => (id() ? sleep(1000).then(() => []) : []), { ssrSource: "client", lazy: true });
  const [hydrated, setHydrated] = createSignal(false);
  onSettled(() => {
    setHydrated(true);
  });
  return (
    <main>
      <i id="hydrated">{hydrated() ? "yes" : "no"}</i>
      <Show when={hydrated()}>
        <Loading fallback={null}>
          <small>{inbox().length}</small>
        </Loading>
      </Show>
      <Show when={overview()}>
        <Show when={overview() > 1}>
          <b id="overview">{overview()}</b>
        </Show>
      </Show>
    </main>
  );
}