import { pullAfterTransportDeath } from "./pull";
import { RequestContext } from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  registerServerReference,
  handleServerFunctionRequest,
  decodeResponse,
} from "@solidjs/web/server-functions/server";
(globalThis as any)[RequestContext] = new AsyncLocalStorage();
export async function run(mode = "error") {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  registerServerReference("body-death", async function* () {
    yield "first";
    await gate;
  });
  const response = await handleServerFunctionRequest(
    new Request("http://localhost/_server/data/body-death", {
      method: "POST",
      body: "[]",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
        "X-Server-Function-Format": "8",
      },
    }),
  );
  const reader = response.body!.getReader();
  let cut!: () => void;
  const failure = new Error("test-owned body failure");
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      cut = () => (mode === "eof" ? controller.close() : controller.error(failure));
    },
    async pull(controller) {
      const next = await reader.read();
      if (next.done) controller.close();
      else controller.enqueue(next.value);
    },
  });
  const [decoded, checked] = body.tee();
  const monitor = (async () => {
    try {
      for await (const _chunk of checked) {
      }
      return mode === "eof";
    } catch (error) {
      return error === failure;
    }
  })();
  try {
    const iterable: any = await decodeResponse(
      new Response(decoded, { headers: response.headers }),
    );
    const iterator = iterable[Symbol.asyncIterator]();
    const first = await iterator.next();
    const outcomePromise = pullAfterTransportDeath(iterator, cut);
    const transportFailed = await monitor;
    const outcome = await outcomePromise;
    return { first, transportFailed, outcome };
  } finally {
    release();
    void reader.cancel().catch(() => {});
  }
}
