import { OBSERVE, createRoot } from "solid-js";
import { createFrame, createFrameHost } from "@solidjs/web/frames";
const capture = OBSERVE!.diagnostics.capture();
createRoot((dispose) => {
  const host = createFrameHost();
  createFrame(document.getElementById("root")!, {
    id: "frame",
    host,
    slots: { children: () => document.createTextNode("fill") },
  });
  host.apply({ type: "start", id: "frame", version: 1 });
  host.apply({
    type: "html",
    id: "frame",
    version: 1,
    html: "<main><!--slot:children:start--></main>",
  });
  host.apply({ type: "complete", id: "frame", version: 1 });
  (window as any).result = {
    observed: !!OBSERVE,
    errors: capture.events
      .filter((e) => e.code === "FRAME_MARKER_CORRUPTED")
      .map((e) => ({ kind: e.kind, severity: e.severity, data: e.data })),
  };
  capture.stop();
  dispose();
});
