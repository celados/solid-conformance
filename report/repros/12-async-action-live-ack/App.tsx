import { action, createOptimisticStore, createSignal, flush, until } from "solid-js";
export default function App() {
  const [source, setSource] = createSignal<{ clientId: string }[]>([]);
  const [rows, setRows] = createOptimisticStore(() => source(), []);
  const [result, setResult] = createSignal("idle");
  const save = action(async function* () {
    setRows((draft) => {
      draft.push({ clientId: "c1" });
    });
    await 0; // Fire-and-forget send resumes outside the action context.
    yield until(() => rows.some((row) => row.clientId === "c1"), { timeout: 100 });
  });
  function run() {
    setResult("waiting");
    save().then(
      () => setResult("confirmed"),
      (error) => setResult(String(error)),
    );
    setTimeout(() => {
      setSource([{ clientId: "c1" }]);
      flush();
    }, 20);
  }
  return (
    <>
      <button id="trigger" onClick={run}>
        Send and acknowledge
      </button>
      <output id="answer">{result()}</output>
    </>
  ); // The real source acknowledges c1, but HEAD times out.
}
