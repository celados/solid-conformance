import { OBSERVE } from "solid-js";
import {
  createFrame,
  createFrameHost,
  applyFrameResponse,
  FRAME_STREAM_HEADER,
} from "@solidjs/web/frames";
import { createChunk } from "@solidjs/web/server-functions/client";
const rows: any[] = [];
for (const kind of [
  "complete",
  "truncated",
  "body-error",
  "malformed",
  "multi",
] as const) {
  const target = document.createElement("div");
  document.body.append(target);
  const host = createFrameHost();
  createFrame(target, { host, id: kind === "complete" ? "local" : "wire" });
  const records: any[] = [];
  const off = OBSERVE?.records.subscribe("frame", (event, live) =>
    records.push({ event, live }),
  );
  const original = new Error("body-original");
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
        c.enqueue(
          createChunk(
            JSON.stringify({ type: "start", id: "wire", version: 1 }),
          ),
        );
        c.enqueue(
          createChunk(
            JSON.stringify({
              type: "html",
              id: "wire",
              version: 1,
              html: "<b>ready</b>",
            }),
          ),
        );
        if (kind === "complete" || kind === "multi")
          c.enqueue(
            createChunk(
              JSON.stringify({ type: "complete", id: "wire", version: 1 }),
            ),
          );
        if (kind === "multi") {
          c.enqueue(
            createChunk(
              JSON.stringify({ type: "start", id: "second", version: 2 }),
            ),
          );
          c.enqueue(
            createChunk(
              JSON.stringify({
                type: "html",
                id: "second",
                version: 2,
                html: "<b>second</b>",
              }),
            ),
          );
          c.enqueue(
            createChunk(
              JSON.stringify({ type: "complete", id: "second", version: 2 }),
            ),
          );
        }
        if (kind === "body-error") setTimeout(() => c.error(original), 10);
        else if (kind === "malformed") {
          c.enqueue(createChunk("{malformed"));
          c.close();
        } else c.close();
      },
    }),
    {
      headers: {
        [FRAME_STREAM_HEADER]: "wire",
        "content-type": "application/x-frame-stream",
      },
    },
  );
  let caught: unknown;
  try {
    await applyFrameResponse(response, host, {
      ...(kind === "complete" ? { as: "local" } : {}),
      version: (id: string) => (id === "second" ? 9 : 7),
    });
  } catch (error) {
    caught = error;
  }
  rows.push({
    kind,
    caught: !!caught,
    records: records.map(({ event, live }) => ({
      event,
      responseSame: live.response === response,
      errorSame: kind === "body-error" ? live.error === original : !!live.error,
      errorMatchesCatch: live.error === caught,
    })),
    text: target.textContent,
  });
  off?.();
  target.remove();
}
(window as any).frameUnions = rows;
