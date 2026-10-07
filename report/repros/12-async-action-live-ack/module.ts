import { createRoot, createSignal, createOptimisticStore, action, until, flush } from "solid-js";
export async function run(reenter = true) {
  let close!: () => void;
  const state = createRoot((dispose) => {
    close = dispose;
    const [source, write] = createSignal<{ clientId: string }[]>([]),
      [rows, set] = createOptimisticStore(() => source(), []);
    let confirmed = false;
    const save = action(async function* () {
      set((d) => {
        d.push({ clientId: "c1" });
      });
      await 0;
      if (reenter) yield;
      yield until(() => rows.some((row) => row.clientId === "c1"), { timeout: 100 });
      confirmed = true;
    });
    return { write, save, confirmed: () => confirmed };
  });
  try {
    const done = state.save().then(
      () => ({ confirmed: state.confirmed(), error: undefined }),
      (error) => ({ confirmed: state.confirmed(), error: String(error) }),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    const beforeEcho = state.confirmed();
    state.write([{ clientId: "c1" }]);
    flush();
    return { beforeEcho, ...(await done) };
  } finally {
    close();
  }
}
