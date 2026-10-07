import { OBSERVE } from "solid-js";
import { hydrate } from "@solidjs/web";
import { RecoveryApp } from "./recovery-app";
const records: any[] = [];
const observed = !location.search.includes("unobserved");
if (observed)
  OBSERVE?.records.subscribe("recovery", (event, live) =>
    records.push({ event, live }),
  );
let clockReads = 0;
const original = performance.now.bind(performance);
Object.defineProperty(performance, "now", {
  configurable: true,
  value: () => {
    clockReads++;
    return original();
  },
});
const unmount = hydrate(
  () => (
    <RecoveryApp
      delay={Number(new URL(location.href).searchParams.get("delay"))}
    />
  ),
  document.getElementById("root")!,
  { renderId: "recovery" },
);
(window as any).recovery = { records, unmount, clockReads: () => clockReads };
