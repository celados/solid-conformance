import { AsyncLocalStorage } from "node:async_hooks";
import { Loading } from "solid-js";
import {
  dynamic,
  renderToStream,
  HydrationScript,
  NoHydration,
  Hydration,
  RequestContext,
  createRequestEvent,
} from "@solidjs/web";
import {
  configureServerFunctionsServer,
  registerServerReference,
  createServerReference,
  handleServerFunctionRequest,
  GET,
} from "@solidjs/web/server-functions/server";
import {
  frameTransformResult,
  frameTransformDirectResult,
  frameTransformFlightResult,
  ServerComponentPlugin,
  SERVER_COMPONENT_BOOTSTRAP,
} from "@solidjs/web/frames/server";
import { CollapsedSlot } from "./collapsed-slot";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
configureServerFunctionsServer({
  transformResult: frameTransformResult,
  transformDirectResult: frameTransformDirectResult,
  transformFlightResult: frameTransformFlightResult,
});
const call = GET(
  createServerReference(
    registerServerReference("collapsed", () => (props: any) => (
      <article>
        <props.panel>
          <span data-server-only>nested-single-copy-token</span>
        </props.panel>
      </article>
    )),
  ),
);
export const handle = (request: Request) => handleServerFunctionRequest(request);
export function documentStream() {
  return scope.run(createRequestEvent(new Request("http://localhost/")), () =>
    renderToStream(
      () => {
        const Content = dynamic(() => call() as any);
        return (
          <NoHydration>
            <html>
              <head>
                <HydrationScript />
                <script innerHTML={SERVER_COMPONENT_BOOTSTRAP} />
              </head>
              <body>
                <div id="root">
                  <Hydration id="collapsed">
                    <Loading fallback="loading">
                      <Content panel={CollapsedSlot} />
                    </Loading>
                  </Hydration>
                </div>
                <script type="module" src="/collapsed-client.js" />
              </body>
            </html>
          </NoHydration>
        );
      },
      { plugins: [ServerComponentPlugin] },
    ),
  );
}
