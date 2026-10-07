import { createMemo, Loading } from "solid-js";
import { dynamic, isServer } from "@solidjs/web";
import { GET, createServerReference } from "@solidjs/web/server-functions";
import { Counter } from "./counter";
export const source: any = {};
// SSR-render and hydrate App: the second Counter disappears.
export function App() {
  const value = createMemo(() =>
    isServer ? source.read() : GET((createServerReference as any)("multisite"))(),
  );
  const Frame = dynamic(() => value() as any);
  return (
    <Loading fallback="pending">
      <Frame counter={Counter} />
      <Frame counter={Counter} />
    </Loading>
  );
}
