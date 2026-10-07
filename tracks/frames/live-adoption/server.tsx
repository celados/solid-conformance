import { AsyncLocalStorage } from "node:async_hooks";
import {
  RequestContext,
  createRequestEvent,
  renderToStream,
  NoHydration,
  Hydration,
  HydrationScript,
} from "@solidjs/web";
import {
  registerServerReference,
  createServerReference,
  GET,
  live,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import { App, stats, source } from "./app";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
export { stats };
live(GET(createServerReference(registerServerReference("live-adoption", source))));
export const handle = (request: Request) => handleServerFunctionRequest(request);
export const documentStream = () =>
  scope.run(createRequestEvent(new Request("http://localhost/")), () =>
    renderToStream(() => (
      <NoHydration>
        <html>
          <head>
            <HydrationScript />
          </head>
          <body>
            <div id="root">
              <Hydration id="live">
                <App />
              </Hydration>
            </div>
            <script type="module" src="/client.js" />
          </body>
        </html>
      </NoHydration>
    )),
  );
