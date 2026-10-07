import { createMemo, createSignal, latest, Loading } from "solid-js";
export default function App() {
  let finish!: (value: number) => void;
  const replacement = new Promise<number>((resolve) => {
    finish = resolve;
  });
  const [id, setId] = createSignal(0);
  const data = createMemo(() => (id() ? replacement : Promise.resolve(1)));
  function load() {
    setId(1); // Replace the source shared by both boundaries.
    setTimeout(() => finish(2), 20); // Every async source is now settled.
  }
  return (
    <>
      <button id="trigger" onClick={load}>
        Load 2
      </button>
      <div id="answer">
        <Loading on={latest(id)} fallback="A">
          <span>{data()}</span>
        </Loading>
        <Loading fallback="B">
          <b>{data()}</b>
        </Loading>
      </div>
    </>
  ); // Wait for 11, then click: it stays A2 rather than becoming 22.
}
