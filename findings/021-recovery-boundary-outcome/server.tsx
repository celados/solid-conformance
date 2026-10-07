import { OBSERVE } from "solid-js";
import { renderToStream, HydrationScript, Hydration, NoHydration } from "@solidjs/web";
import { RecoveryApp } from "./app";
export const records: any[] = [];
OBSERVE?.records.subscribe("boundary", (event, live) => records.push({ event, live }));
export function documentStream(delay: number) {
  return renderToStream(
    () => (
      <NoHydration>
        <html>
          <head>
            <HydrationScript />
          </head>
          <body>
            <div id="root">
              <Hydration id="recovery">
                <RecoveryApp delay={delay} />
              </Hydration>
            </div>
            <script type="module" async src="/client.js" />
          </body>
        </html>
      </NoHydration>
    ),
    { onError() {} },
  );
}
