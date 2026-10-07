import { createSignal, Loading, flush } from "solid-js";
import { render, dynamic } from "@solidjs/web";
import { createServerReference } from "@solidjs/web/server-functions/client";
import { installServerComponents } from "@solidjs/web/frames";
installServerComponents();
const get = createServerReference("region");
const [id, setId] = createSignal(1);
const [version, setVersion] = createSignal(0);
const Component = dynamic(() => {
  version();
  return get(id()) as any;
});
render(
  () => (
    <Loading fallback={<b>pending</b>}>
      <Component wrap={(p: any) => <section>{p.children}</section>} />
    </Loading>
  ),
  document.getElementById("root")!,
);
(window as any).refetch = () => {
  setVersion(1);
  flush();
};
(window as any).change = () => {
  setId(2);
  flush();
};
