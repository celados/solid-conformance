import {
  createServerReference,
  registerServerReference,
  handleServerFunctionRequest,
  GET,
} from "@solidjs/web/server-functions/server";
import { getRequestEvent, RequestContext } from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
(globalThis as any)[RequestContext] ??= new AsyncLocalStorage();
export const stats = { opened: 0, closed: 0 };
GET(
  createServerReference(
    registerServerReference("standing", async function* () {
      const signal = getRequestEvent()!.request.signal;
      try {
        yield ++stats.opened;
        await new Promise<void>((resolve) =>
          signal.addEventListener("abort", () => resolve(), { once: true }),
        );
      } finally {
        stats.closed++;
      }
    }),
  ),
);
export const handle = (request: Request) => handleServerFunctionRequest(request);
