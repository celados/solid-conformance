import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "@solidjs/web";
import {
  GET,
  createServerReference,
  registerServerReference,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import { read } from "./read";
export { calls } from "./read";
(globalThis as any)[RequestContext] = new AsyncLocalStorage();
GET(createServerReference(registerServerReference("conditional", read)));
export const handle = handleServerFunctionRequest;
