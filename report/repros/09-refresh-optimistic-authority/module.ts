import { action, createOptimistic, createRoot, refresh, resolve } from "solid-js";
export async function run() {
  let dispose!: () => void;
  const state = createRoot((d) => {
    dispose = d;
    const [read, write] = createOptimistic(() => Promise.resolve(2));
    const save = action(function* () {
      write(99);
      return yield refresh(read);
    });
    return { read, save };
  });
  try {
    await resolve(state.read);
    return await state.save();
  } finally {
    dispose();
  }
}
