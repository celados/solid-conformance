import { render, hydrate } from "@solidjs/web";
import { flush } from "solid-js";
import { installServerComponents } from "@solidjs/web/frames";
import { App } from "./app";
installServerComponents();
const root = document.getElementById("root")!;
location.search.includes("hydrate")
  ? hydrate(App, root, { renderId: "multisite" })
  : render(App, root);
(window as any).ready = async () => {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 10));
    flush();
  }
};
