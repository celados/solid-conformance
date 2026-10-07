import {
  createServerReference,
  registerServerReference,
  configureServerFunctionsServer,
  handleServerFunctionRequest,
} from "@solidjs/web/server-functions/server";
import { frameTransformResult } from "@solidjs/web/frames/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { RequestContext } from "@solidjs/web";
(globalThis as any)[RequestContext] ??= new AsyncLocalStorage();
configureServerFunctionsServer({ transformResult: frameTransformResult });
createServerReference(
  registerServerReference("region", (id: number) => (p: any) => (
    <main>
      <p.wrap>
        <span>{id}</span>
      </p.wrap>
    </main>
  )),
);
export const handle = (r: Request) => handleServerFunctionRequest(r);
