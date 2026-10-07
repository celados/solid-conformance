import { action, affects, createRoot, createStore } from "solid-js";
export async function run() {
  let dispose!: () => void;
  const save = createRoot((d) => {
    dispose = d;
    const [store] = createStore({ n: 1 });
    return action(function* () {
      affects(store, "n");
    });
  });
  try {
    await save();
  } finally {
    dispose();
  }
}
