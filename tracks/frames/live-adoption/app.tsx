import { createMemo, Loading } from "solid-js";
import { createServerReference, GET, live } from "@solidjs/web/server-functions";
import { isServer } from "@solidjs/web";
export const stats = { opened: 0, closed: 0 };
export async function* source() {
  stats.opened++;
  try {
    yield "first";
    yield "second";
  } finally {
    stats.closed++;
  }
}
const call = live(
  GET(
    createServerReference(
      (isServer ? { id: "live-adoption", fn: source } : "live-adoption") as any,
    ),
  ),
);
function Value() {
  const value = createMemo(() => call());
  return <b data-value>{value()}</b>;
}
export const App = () => (
  <Loading fallback={<i data-fallback>pending</i>}>
    <Value />
  </Loading>
);
