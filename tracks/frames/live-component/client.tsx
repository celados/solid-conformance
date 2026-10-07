import { hydrate } from "@solidjs/web";
import { installServerComponents } from "@solidjs/web/frames";
import { configureServerFunctionsClient } from "@solidjs/web/server-functions/client";
import { App, statuses } from "./app";
const requests: string[] = [];
configureServerFunctionsClient({
  fetch: (address, init) => {
    requests.push(String(address));
    return fetch(address, init);
  },
});
installServerComponents();
const before = document.querySelector("[data-live-component]");
const close = hydrate(() => <App />, document.getElementById("root")!, {
  renderId: "live",
});
(window as any).liveComponent = {
  snapshot: () => ({
    requests,
    statuses,
    text: document.querySelector("[data-live-component]")?.textContent,
    adopted: before === document.querySelector("[data-live-component]"),
    html: document.getElementById("root")!.innerHTML,
  }),
  close,
};
