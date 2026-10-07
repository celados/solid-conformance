import { OBSERVE } from "solid-js";
import { renderToStream } from "@solidjs/web";
export function run() {
  const capture = OBSERVE!.diagnostics.capture();
  const original = new Error("initial pass");
  let hooks = 0;
  try {
    renderToStream(
      () => {
        throw original;
      },
      {
        onError(error) {
          if (error === original) hooks++;
        },
      },
    );
  } catch (error) {
    if (error !== original) throw error;
  }
  const events = capture.events.filter((e) => e.code === "SSR_RENDER_ERROR_CONTAINED");
  capture.stop();
  return { hooks, events: events.length };
}
