import { hydrate, render } from "@solidjs/web";
import { configureServerFunctionsClient } from "@solidjs/web/server-functions/client";
import { App } from "./app";
const requests: any[] = [];
configureServerFunctionsClient({
  fetch: (address, init) => {
    requests.push({ address, headers: [...new Headers(init.headers)] });
    return fetch(address, init);
  },
});
const unmount = location.search.includes("hydrate")
  ? hydrate(() => <App />, document.getElementById("root")!, { renderId: "live" })
  : render(() => <App />, document.getElementById("root")!);
(window as any).liveAdoption = { requests, unmount };
