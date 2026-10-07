import { createSignal } from "solid-js";
export function Counter(props: any) {
  const [count, setCount] = createSignal(0);
  return (
    <button data-counter={props.cid} onClick={() => setCount((n) => n + 1)}>
      {count()}
      {props.children}
    </button>
  );
}
