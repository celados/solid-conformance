import { Loading, Errored, createMemo } from "solid-js";
import { render } from "@solidjs/web";
import {
  GET,
  live,
  createServerReference,
} from "@solidjs/web/server-functions/client";
const statuses: string[] = [];
const base = GET(createServerReference("death-boundary"));
const fn = location.search.includes("buffer") ? live(base) : base;
let inner = 0,
  outer = 0;
function Content() {
  const answer = createMemo(() => {
    const source = fn();
    if (location.search.includes("buffer"))
      source.onstatus = (s: string) => statuses.push(s);
    return source;
  });
  const pending = createMemo(() => answer().pending);
  return <b>{pending()}</b>;
}
const dispose = render(
  () => (
    <Errored
      fallback={() => {
        outer++;
        return "outer";
      }}
    >
      <Errored
        fallback={() => {
          inner++;
          return <b data-error>nearest</b>;
        }}
      >
        <Loading fallback="waiting">
          <Content />
        </Loading>
      </Errored>
    </Errored>
  ),
  document.getElementById("root")!,
);
(window as any).deathBoundary = {
  snapshot: () => ({
    text: document.getElementById("root")!.textContent,
    inner,
    outer,
    statuses,
  }),
  dispose,
};
