import { AsyncLocalStorage } from "node:async_hooks";
import { createMemo, onCleanup } from "solid-js";
import {
  RequestContext,
  getRequestEvent,
  createRequestEvent,
  renderToStream,
  NoHydration,
  Hydration,
  HydrationScript,
} from "@solidjs/web";
import {
  configureServerFunctionsServer,
  registerServerReference,
  createServerReference,
  GET,
  live,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import {
  frameTransformResult,
  frameTransformDirectResult,
  frameTransformFlightResult,
  ServerComponentPlugin,
  SERVER_COMPONENT_BOOTSTRAP,
} from "@solidjs/web/frames/server";
import { App } from "./app";
const scope = new AsyncLocalStorage();
(globalThis as any)[RequestContext] = scope;
configureServerFunctionsServer({
  transformResult: frameTransformResult,
  transformDirectResult: frameTransformDirectResult,
  transformFlightResult: frameTransformFlightResult,
});
import { produce, stats, push } from "./producer";
export { stats, push };
live(
  GET(
    createServerReference(registerServerReference("live-component", produce)),
  ),
);
export const received: any[] = [];
export const handle = (request: Request) => {
  received.push({
    position: request.headers.get("Last-Event-ID"),
    method: request.method,
  });
  return handleServerFunctionRequest(request);
};
export const document = (request: Request, entry = "/client.js") =>
  scope.run(createRequestEvent(request), () =>
    renderToStream(
      () => (
        <NoHydration>
          <html>
            <head>
              <HydrationScript />
              <script innerHTML={SERVER_COMPONENT_BOOTSTRAP} />
            </head>
            <body>
              <div id="root">
                <Hydration id="live">
                  <App />
                </Hydration>
              </div>
              <script type="module" async src={entry} />
            </body>
          </html>
        </NoHydration>
      ),
      { plugins: [ServerComponentPlugin] },
    ),
  );
