import { createMemo, createSignal, refresh, resolve } from "solid-js";
export default function App() {
  let calls = 0;
  const value = createMemo(() => Promise.resolve(++calls));
  const [result, setResult] = createSignal("idle");
  async function run() {
    await resolve(value); // The first computation has settled with 1.
    setResult("refreshing");
    setResult(String(await refresh(value))); // Production never reaches this write.
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Refresh
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // Click: development shows 2; production remains refreshing.
}
