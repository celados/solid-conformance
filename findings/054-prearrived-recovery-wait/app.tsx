import { Loading, createMemo } from "solid-js";
import { isServer } from "@solidjs/web";
function Child() {
  const value = createMemo(() =>
    isServer
      ? new Promise<string>((_r, j) =>
          setTimeout(() => j(new Error("server failure")), 0),
        )
      : Promise.resolve("recovered"),
  );
  return <b>{value()}</b>;
}
export const App = () => (
  <Loading fallback="waiting">
    <Child />
  </Loading>
);
