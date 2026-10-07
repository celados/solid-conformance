import { createSignal, createStore, Errored, Loading } from "solid-js";
export default function App() {
  let reject!: (error: Error) => void;
  const replacement = new Promise<{ value: number }>((_, fail) => {
    reject = fail;
  });
  const [id, setId] = createSignal(0);
  const [store] = createStore(() => (id() ? replacement : { value: 0 }), { value: 0 });
  function replace() {
    setId(1); // Start a replacement request.
    setTimeout(() => reject(new Error("replacement failed")), 20);
  }
  return (
    <>
      <button id="trigger" onClick={replace}>
        Replace and reject
      </button>
      <Errored fallback={() => <b id="answer">error</b>}>
        <Loading fallback={<i>pending</i>}>
          <span id="answer">{store.value}</span>
        </Loading>
      </Errored>
    </>
  ); // After the click: still 0, instead of the error fallback.
}
