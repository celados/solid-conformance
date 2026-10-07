import {
  renderToStream,
  HydrationScript,
  Hydration,
  NoHydration,
} from "@solidjs/web";
import { App } from "./app";
export const document = async () =>
  String(
    await renderToStream(
      () => (
        <NoHydration>
          <html>
            <head>
              <HydrationScript />
            </head>
            <body>
              <div id="root">
                <Hydration id="prearrived">
                  <App />
                </Hydration>
              </div>
            </body>
          </html>
        </NoHydration>
      ),
      { onError() {} },
    ),
  ) +
  '<script>window.fullWireParsed=true</script><script type="module" src="/client.js"></script>';
