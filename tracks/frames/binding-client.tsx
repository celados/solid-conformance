import { OBSERVE, Loading } from "solid-js";
import { dynamic, render } from "@solidjs/web";
import { installServerComponents } from "@solidjs/web/frames";
import {
  configureServerFunctionsClient,
  createServerReference,
  GET,
} from "@solidjs/web/server-functions/client";
installServerComponents();
configureServerFunctionsClient({
  fetch: (address, init) => {
    const headers = new Headers(init.headers);
    if (location.search.includes("omit-record"))
      headers.set("x-omit-slot-record", "true");
    if (location.search.includes("corrupt"))
      headers.set("x-corrupt-markers", "true");
    return fetch(address, { ...init, headers });
  },
});
const read = GET(createServerReference("binding-client"));
const delay = () => new Promise((r) => setTimeout(r, 50));
const shapes: Record<string, () => any> = {
  array: () => [],
  null: () => null,
  number: () => 7,
  async: () => Promise.resolve({ title: "wrong" }),
  node: () => document.createElement("span"),
  "text-object": () => ({ title: {} }),
  "text-array": () => ({ title: [] }),
  "text-function": () => ({ title: () => 7 }),
  "text-async": () => ({ title: Promise.resolve(7) }),
  tuple: () => ({
    title: "tupleworks",
    click: [
      (data: unknown, event: Event) => {
        (window as any).tupleArgs = [data, event.type];
      },
      7,
    ],
  }),
  valid: () => ({
    title: "works",
    hidden: false,
    click: () => {
      (window as any).clicked++;
    },
  }),
};
(window as any).clicked = 0;
(window as any).binding = {
  async run(shape: string) {
    const target = document.getElementById("root")!;
    const capture = OBSERVE?.diagnostics.capture();
    const C = dynamic(() =>
      shape === "corrupt"
        ? (GET(createServerReference("corrupt-slot"))() as any)
        : (read(shape) as any),
    );
    const props =
      shape === "corrupt"
        ? { children: "client-fill" }
        : shape === "missing-fill"
          ? {}
          : shape === "nonfunction"
            ? { row: 7 }
            : { row: shapes[shape] };
    const unmount = render(
      () => (
        <Loading fallback="loading">
          <C {...props} />
        </Loading>
      ),
      target,
    );
    for (
      let i = 0;
      i < 20 && !target.querySelector(shape === "corrupt" ? "main" : "button");
      i++
    )
      await delay();
    await delay();
    const events =
      capture?.events.map((e) => ({
        code: e.code,
        data: e.data,
        severity: e.severity,
        kind: e.kind,
      })) ?? [];
    capture?.stop();
    const button = target.querySelector("button")!;
    const text = button?.textContent;
    if (shape === "valid" || shape === "tuple") button.click();
    unmount();
    return {
      events,
      text,
      tupleArgs: (window as any).tupleArgs,
      clicked: (window as any).clicked,
      remaining: target.textContent,
    };
  },
};
