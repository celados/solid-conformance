import { action, createOptimistic, createSignal, refresh, resolve } from "solid-js";
export default function App() {
  const [value, setValue] = createOptimistic(() => Promise.resolve(2));
  const [result, setResult] = createSignal("idle");
  const save = action(function* () {
    setValue(99); // The caller's optimistic guess, not server truth.
    return yield refresh(value);
  });
  async function run() {
    await resolve(value);
    setResult(String(await save())); // Observed 99; the source returns 2.
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Refresh inside action
      </button>
      <output id="answer">{result()}</output>
    </>
  );
}
