import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "@solidjs/web";
import {
  GET,
  createServerReference,
  registerServerReference,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
(globalThis as any)[RequestContext] = new AsyncLocalStorage();
let finish!: () => void;
const gate = new Promise<void>((r) => (finish = r));
GET(
  createServerReference(
    registerServerReference("death-boundary", () => ({ pending: gate })),
  ),
);
let cut: () => void = () => {};
export const stats = { calls: 0, chunks: 0, buffered: 0 };
export const drop = () => cut();
export const close = () => finish();
export async function handle(request: Request) {
  stats.calls++;
  const response = await handleServerFunctionRequest(request);
  const reader = response.body!.getReader();
  const buffering = new URL(request.url).pathname.includes("/live/");
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      if (buffering) c.enqueue(new TextEncoder().encode(":\n\n"));
      cut = () => {
        c.error(new Error("test-owned proxy death"));
        void reader.cancel().catch(() => {});
        finish();
      };
    },
    async pull(c) {
      try {
        const next = await reader.read();
        if (next.done) {
          c.close();
          return;
        }
        stats.chunks++;
        if (buffering) stats.buffered += next.value.byteLength;
        else c.enqueue(next.value);
      } catch (error) {
        c.error(error);
      }
    },
  });
  return new Response(body, { headers: response.headers });
}
