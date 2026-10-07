import { OBSERVE } from "solid-js";
import { hydrate } from "@solidjs/web";
import { App } from "./app";
if (document.readyState === "loading")
  await new Promise((r) =>
    document.addEventListener("DOMContentLoaded", r, { once: true }),
  );
await Promise.resolve();
const wireParsed = (window as any).fullWireParsed === true;
let clock = 1000;
Object.defineProperty(performance, "now", {
  configurable: true,
  value: () => {
    const value = clock;
    clock += 100;
    return value;
  },
});
const records: any[] = [];
OBSERVE?.records.subscribe("recovery", (event) => records.push(event));
const unmount = hydrate(() => <App />, document.getElementById("root")!, {
  renderId: "prearrived",
});
(window as any).recoveryRepro = { wireParsed, records, unmount };
