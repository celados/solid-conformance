import { action, affects, createSignal, createStore } from "solid-js";
export default function App() {
  const [store] = createStore({ n: 1 });
  const [result, setResult] = createSignal("idle");
  const save = action(function* () {
    affects(store, "n");
  });
  function run() {
    save().then(
      () => setResult("ok"),
      (error) => setResult(String(error)),
    );
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Declare pending slot
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // In a tree-shaken production bundle: a registration-hook error.
}
