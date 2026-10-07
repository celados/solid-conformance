import { OBSERVE } from "solid-js";
import { hydrate } from "@solidjs/web";
import { RecoveryApp } from "./app";
const records: any[] = [];
OBSERVE?.records.subscribe("recovery", (event, live) => records.push({ event, live }));
const unmount = hydrate(
  () => <RecoveryApp delay={Number(new URL(location.href).searchParams.get("delay"))} />,
  document.getElementById("root")!,
  { renderId: "recovery" },
);
(window as any).recovery = { records, unmount };
