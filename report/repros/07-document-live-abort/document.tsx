import { createMemo } from "solid-js";
import { renderToStream } from "@solidjs/web";
import { frameTransformDirectResult } from "@solidjs/web/frames/server";

export function startDocument(values: () => AsyncIterable<number>) {
  const Component = frameTransformDirectResult(
    () => {
      const value = createMemo(values);
      return <b>{value()}</b>;
    },
    { id: "minimal" },
  );
  const controller = new AbortController();
  let html = "";
  const stream = renderToStream(() => Component(), {
    signal: controller.signal,
    onError() {},
  });
  stream.pipe({
    write: (chunk) => {
      html += String(chunk);
    },
    end() {},
  });
  // After the first value, abort(), then finish the source.
  // Source completion throws "Controller is already closed".
  return { abort: () => controller.abort(), html: () => html };
}
