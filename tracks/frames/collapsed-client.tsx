import { Loading } from "solid-js";
import { dynamic, render, hydrate } from "@solidjs/web";
import { installServerComponents } from "@solidjs/web/frames";
import {
  configureServerFunctionsClient,
  createServerReference,
  GET,
} from "@solidjs/web/server-functions/client";
import { CollapsedSlot } from "./collapsed-slot";
installServerComponents();
const requests: string[] = [];
configureServerFunctionsClient({
  fetch: (address, init) => {
    requests.push(address);
    return fetch(address, init);
  },
});
const Content = dynamic(() => GET(createServerReference("collapsed"))() as any);
const App = () => (
  <Loading fallback="loading">
    <Content panel={CollapsedSlot} />
  </Loading>
);
const root = document.getElementById("root")!;
const unmount = location.search.includes("hydrate")
  ? hydrate(App, root, { renderId: "collapsed" })
  : render(App, root);
(window as any).collapsed = { requests, unmount };
