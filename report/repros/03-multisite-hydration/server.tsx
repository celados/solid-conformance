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
  configureServerFunctionsServer,
  registerServerReference,
  createServerReference,
  GET,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import {
  frameTransformResult,
  frameTransformDirectResult,
  ServerComponentPlugin,
  SERVER_COMPONENT_BOOTSTRAP,
} from "@solidjs/web/frames/server";
import { App, source } from "./app";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
configureServerFunctionsServer({
  transformResult: frameTransformResult,
  transformDirectResult: frameTransformDirectResult,
});
source.read = GET(
  createServerReference(registerServerReference("multisite", () => (p: any) => <p.counter />)),
);
export const handle = (r: Request) => handleServerFunctionRequest(r);
export const documentStream = () =>
  scope.run(createRequestEvent(new Request("http://localhost/")), () =>
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
                <Hydration id="multisite">
                  <App />
                </Hydration>
              </div>
              <script type="module" src="/client.js" />
            </body>
          </html>
        </NoHydration>
      ),
      { plugins: [ServerComponentPlugin] },
    ),
  );
