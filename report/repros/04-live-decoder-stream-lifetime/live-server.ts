import {
  createServerReference,
  registerServerReference,
  handleServerFunctionRequest,
  GET,
} from "@solidjs/web/server-functions/server";
import { RequestContext } from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
(globalThis as any)[RequestContext] ??= new AsyncLocalStorage();
export let release: (() => void) | undefined;
export const stats = { opened: 0, closed: 0 };
GET(
  createServerReference(
    registerServerReference("standing", async function* () {
      try {
        yield ++stats.opened;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      } finally {
        stats.closed++;
      }
    }),
  ),
);
export const handle = (request: Request) => handleServerFunctionRequest(request);
