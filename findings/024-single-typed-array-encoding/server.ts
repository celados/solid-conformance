import {
  registerServerReference,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "@solidjs/web";
(globalThis as any)[RequestContext] = new AsyncLocalStorage();
registerServerReference("typed", (body: unknown) => body);
export const handle = (request: Request) => handleServerFunctionRequest(request);
