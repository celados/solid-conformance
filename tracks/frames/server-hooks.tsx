import { OBSERVE, createMemo, Errored, Loading } from "solid-js";
import {
  renderToStream,
  renderToString,
  isDev,
  RequestContext,
  createRequestEvent,
  configureServerErrors,
  reportRequestFailure,
} from "@solidjs/web";
import {
  registerServerReference,
  createServerReference,
  handleServerFunctionRequest,
  decodeResponse,
} from "@solidjs/web/server-functions/server";
import { AsyncLocalStorage } from "node:async_hooks";
import { equal, ok, runCases, type DocCase } from "../docs/registry";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
const cases: DocCase[] = [];
let configureExternal:typeof configureServerErrors;
let serial = 0;
const doc = (id: string, statement: string, run: DocCase["run"]) =>
  cases.push({ id: "12/server-hook-" + id, file: "12-ssr-http.md", statement, run:()=>scope.run(createRequestEvent(new Request("http://localhost/")),run) });
const reference = (fn: (...args: any[]) => any): any =>
  createServerReference(registerServerReference("hook-" + serial++, fn));
const request = (id: string) =>
  new Request("http://localhost/_server/data/" + id, {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      "X-Server-Function-Format": "8",
    },
    body: "[]",
  });
async function hooked(run: (heard: any[], messages: string[]) => unknown) {
  const heard: any[] = [];
  const messages: string[] = [];
  const old = [console.warn, console.error, console.info];
  console.warn =
    console.error =
    console.info =
      (...args) => messages.push(args.map(String).join(" "));
  configureServerErrors({
    onError: (error, site) => {
      heard.push({ error, site });
    },
  });
  try {
    await run(heard, messages);
    await new Promise((r) => setTimeout(r, 5));
  } finally {
    configureServerErrors({ onError: undefined });
    [console.warn, console.error, console.info] = old as any;
  }
}
function Broken(props: { error: unknown }): never {
  throw props.error;
}
doc(
  "fallback-mapping",
  "The error hook returns the fallback and hydration wire value without needing markSafeError, in every tier.",
  async () =>
    hooked(async (heard) => {
      const original = new Error("private-original"),
        replacement = new Error("authored replacement");
      configureServerErrors({
        onError: (error, site) => {
          heard.push({ error, site });
          return replacement;
        },
      });
      const html = renderToString(() => (
        <Errored fallback={(e) => <b>{(e() as Error).message}</b>}>
          <Broken error={original} />
        </Errored>
      ));
      equal(heard.length, 1);
      ok(heard[0].error === original);
      equal(heard[0].site.kind, "render");
      equal(heard[0].site.handling, "fallback");
      ok(heard[0].site.boundary);
      ok(heard[0].site.event);
      if (isDev) {
        ok(JSON.stringify(heard[0].site.ownerPath).includes("Broken"));
        ok(Array.isArray(heard[0].site.boundaryPath));
      }
      ok(html.includes("authored replacement"));
      ok(!html.includes("Internal Server Error"));
    }),
);
for (const mode of ["string", "stream"] as const)
  doc(
    "initial-failed-" + mode,
    "The initial synchronous throw reports render/failed before reaching the caller; hook returns do not replace a failure with no wire.",
    async () =>
      hooked(async (heard) => {
        const original = new Error("root failure");
        configureServerErrors({
          onError: (error, site) => {
            heard.push({ error, site });
            return new Error("ignored map");
          },
        });
        let thrown: unknown;
        try {
          (mode === "string" ? renderToString : renderToStream)(() => {
            throw original;
          });
        } catch (error) {
          thrown = error;
        }
        ok(thrown === original);
        equal(heard.length, 1);
        ok(heard[0].error === original);
        equal(heard[0].site.kind, "render");
        equal(heard[0].site.handling, "failed");
        reportRequestFailure(original, heard[0].site.event);
        equal(heard.length, 1);
      }),
  );
doc(
  "direct-first-verdict",
  "A direct server-function throw reports once at invocation, and Errored reuses its mapped verdict.",
  async () =>
    hooked(async (heard) => {
      const original = new Error("direct failure"),
        mapped = new Error("mapped direct");
      const fn = reference(() => {
        throw original;
      });
      configureServerErrors({
        onError: (error, site) => {
          heard.push({ error, site });
          return mapped;
        },
      });
      const html = renderToString(() => (
        <Errored fallback={(e) => <b>{(e() as Error).message}</b>}>
          <span>{fn()}</span>
        </Errored>
      ));
      equal(heard.length, 1);
      ok(heard[0].error === original);
      equal(heard[0].site.kind, "server-function");
      equal(heard[0].site.handling, "thrown");
      equal(heard[0].site.direct, true);
      equal(heard[0].site.functionId, fn.id);
      ok(html.includes("mapped direct"));
    }),
);
doc(
  "rpc-per-request-map",
  "An HTTP dispatch override wins ambient policy and its unbranded replacement reaches the caller.",
  async () =>
    hooked(async (heard) => {
      const original = new Error("rpc failure"),
        mapped = new Error("mapped rpc");
      const local: any[] = [];
      const fn = reference(() => {
        throw original;
      });
      const response = await handleServerFunctionRequest(request(fn.id), {
        onError: (error, site) => {
          local.push({ error, site });
          return mapped;
        },
      });
      const wire: any = await decodeResponse(response).catch((e) => e);
      equal(wire.message, "mapped rpc");
      equal(heard.length, 0);
      equal(local.length, 1);
      ok(local[0].error === original);
      equal(local[0].site.direct, false);
      equal(local[0].site.kind, "server-function");
      equal(local[0].site.handling, "thrown");
      equal(local[0].site.functionId, fn.id);
      ok(local[0].site.event);
    }),
);
doc(
  "rpc-deferred-channel",
  "A rejecting result-graph promise reports channel after the 200 head, and maps its error exactly once.",
  async () =>
    hooked(async (heard) => {
      const original = new Error("channel private"),
        mapped = new Error("mapped channel");
      let reject!: (error: unknown) => void;
      const deferred = new Promise((_, j) => {
        reject = j;
      });
      configureServerErrors({
        onError: (error, site) => {
          heard.push({ error, site });
          return mapped;
        },
      });
      const fn = reference(() => ({ later: deferred }));
      const response = await handleServerFunctionRequest(request(fn.id));
      equal(response.status, 200);
      const body: any = await decodeResponse(response);
      const caught = body.later.catch((e: any) => e);
      reject(original);
      const wire = await caught;
      equal(wire.message, "mapped channel");
      equal(heard.length, 1);
      ok(heard[0].error === original);
      equal(heard[0].site.handling, "channel");
      equal(heard[0].site.kind, "server-function");
      equal(heard[0].site.direct, false);
      equal(heard[0].site.functionId, fn.id);
    }),
);
doc(
  "request-failed-once",
  "reportRequestFailure reports request/failed with its event once through the ambient hook.",
  async () =>
    hooked(async (heard) => {
      const original = new Error("setup failure");
      const event = createRequestEvent(new Request("http://localhost/setup"));
      reportRequestFailure(original, event);
      reportRequestFailure(original, event);
      equal(heard.length, 1);
      ok(heard[0].error === original);
      equal(heard[0].site.kind, "request");
      equal(heard[0].site.handling, "failed");
      ok(heard[0].site.event === event);
    }),
);
doc(
  "throwing-hook",
  "A throwing hook is reported to console and treated as silent; the default wire policy applies.",
  async () =>
    hooked(async (_heard, messages) => {
      const original = new Error("private-hook-failure");
      configureServerErrors({
        onError: () => {
          throw new Error("monitor failure");
        },
      });
      const html = renderToString(() => (
        <Errored fallback={(e) => <b>{(e() as Error).message}</b>}>
          <Broken error={original} />
        </Errored>
      ));
      ok(html.includes(isDev ? "private-hook-failure" : "Internal Server Error"));
      ok(messages.some((m) => m.includes("monitor failure")));
    }),
);
doc(
  "render-override",
  "A render-local hook wins ambient and hears handled fallback failures under the old one-argument callback shape.",
  async () =>
    hooked(async (heard) => {
      const original = new Error("local render");
      const local: unknown[] = [];
      renderToString(
        () => (
          <Errored fallback={() => <b>handled</b>}>
            <Broken error={original} />
          </Errored>
        ),
        {
          onError: (error) => {
            local.push(error);
          },
        },
      );
      equal(local.length, 1);
      ok(local[0] === original);
      equal(heard.length, 0);
    }),
);
doc(
  "serialization-road",
  "An unencodable async hydration value reports render/serialize and the render continues without adopting it.",
  async () =>
    hooked(async (heard) => {
      function Unencodable() {
        const value = createMemo(() => Promise.resolve({ fn: () => 42 }));
        return <b>{value().fn()}</b>;
      }
      const html = await renderToStream(
        () => (
          <Loading fallback="waiting">
            <Unencodable />
          </Loading>
        ),
        {
          onError: (error, site) => {
            heard.push({ error, site });
            return new Error("ignored serialize map");
          },
        },
      );
      ok(html.includes("42"));
      ok(heard.some((x) => x.site.kind === "render" && x.site.handling === "serialize"));
      ok(!html.includes("ignored serialize map"));
    }),
);
doc("no-hook-failed-console", "Without a hook, request failures log but synchronous render failures are left to the caller.", async () => hooked(async (_heard,messages) => {
 configureServerErrors({onError:undefined});
 const original=new Error("unhandled setup console");
 reportRequestFailure(original,createRequestEvent(new Request("http://localhost/setup")));
 ok(messages.some(m=>m.includes("unhandled setup console")));
 const before=messages.length;
 const thrown=new Error("sync caller failure");
 try {renderToString(()=>{throw thrown})} catch(e){ok(e===thrown)}
 equal(messages.length,before);
}));
doc("direct-render-override", "The render-local override handles a direct invocation (RFC12 ambient-only counterexample: finding031).",async()=>hooked(async(heard)=>{
 const original=new Error("ambient direct original"),mapped=new Error("ambient direct intent");
 configureServerErrors({onError:(error,site)=>{heard.push({error,site});return mapped}});
 const fn=reference(()=>{throw original}),local:any[]=[];
 const html=renderToString(()=><Errored fallback={e=><b>{(e() as Error).message}</b>}><span>{fn()}</span></Errored>,{onError:(e,site)=>{local.push([e,site]);return new Error("wrong local")}});
 equal(local.length,1);equal(heard.length,0);ok(local[0][0]===original);equal(local[0][1].kind,"server-function");equal(local[0][1].direct,true);ok(html.includes("wrong local"));
}));
doc("client-source-mapping", "A rejected async source uses default serialized rejection but its Loading record carries the authored mapping.",async()=>hooked(async(heard)=>{
 let reject!:(e:unknown)=>void;const original=new Error("private async source"),mapped=new Error("mapped async boundary");
 const pending=new Promise<string>((_,j)=>reject=j);
 configureServerErrors({onError:(error,site)=>{heard.push({error,site});return mapped}});
 function Pending(){const value=createMemo(()=>pending);return <b>{value()}</b>}
 const stream=renderToStream(()=><Loading fallback="pending"><Pending/></Loading>);
 let html="";const ended=new Promise<void>(resolve=>stream.pipe({write(chunk:any){html+=String(chunk)},end:resolve}));await new Promise(r=>setTimeout(r,5));reject(original);await ended;
 equal(heard.length,1);ok(heard[0].error===original);equal(heard[0].site.kind,"render");equal(heard[0].site.handling,"client");ok(heard[0].site.boundary);ok(heard[0].site.event);
 ok(html.includes("mapped async boundary"), html);ok(html.includes(isDev?"private async source":"Internal Server Error"),html);
}));
doc("direct-observe-multi-road", "One direct invocation verdict keeps both invocation and contained-error records in observed builds.",async()=>hooked(async(heard)=>{
 const original=new Error("observe original");const records:any[]=[];
 const off=OBSERVE?.records.subscribe("invocation",(event,live)=>records.push({event,live}));const session=OBSERVE?.diagnostics.capture();
 try{
 const fn=reference(()=>{throw original});renderToString(()=><Errored fallback="contained"><span>{fn()}</span></Errored>);
 await new Promise(r=>setTimeout(r,5));ok(heard.length===1,JSON.stringify({heard,records,events:session?.events}));
 if(OBSERVE){ok(records.length===1, JSON.stringify({records,events:session!.events}));ok(records[0].live.error===original);const errors=session!.events.filter(e=>e.code==="SSR_RENDER_ERROR_CONTAINED");ok(errors.length===1, JSON.stringify({records,events:session!.events}));equal(errors[0]!.kind,"ssr");equal(errors[0]!.severity,"error");ok(errors[0]!.data?.error===original)}
 }finally{off?.();session?.stop()}
}));
doc("external-ambient-symbol", "Independently bundled configureServerErrors policy reaches this server build through a registered global symbol.",async()=>hooked(async()=>{
 const original=new Error("external original"),heard:any[]=[];
 configureExternal({onError:(error,site)=>{heard.push({error,site});return new Error("external mapped")}});
 const html=renderToString(()=><Errored fallback={e=><b>{(e() as Error).message}</b>}><Broken error={original}/></Errored>);
 equal(heard.length,1);ok(heard[0].error===original);ok(html.includes("external mapped"));
}));
doc("stream-old-shape", "Stream onError with the old single-argument shape hears a handled failure without failing the render.",async()=>hooked(async(heard)=>{
 const original=new Error("stream handled"),local:unknown[]=[];
 const html=await renderToStream(()=><Errored fallback="handled"><Broken error={original}/></Errored>,{onError:error=>{local.push(error)}});
 equal(local.length,1);ok(local[0]===original);equal(heard.length,0);ok(html.includes("handled"));
}));
doc("loading-repull-same-verdict", "Loading re-pulls repeating one source rejection use one error-object hook verdict across two boundaries.",async()=>hooked(async(heard)=>{
 const original=new Error("repull original"),mapped=new Error("repull mapped");let reject!:(e:unknown)=>void,reads=0;
 const pending=new Promise<string>((_,j)=>reject=j);
 configureServerErrors({onError:(error,site)=>{heard.push({error,site});return mapped}});
 function Pending(){const value=createMemo(()=>pending);return <b>{(()=>{reads++;return value()})()}</b>}
 const stream=renderToStream(()=><><Loading fallback="one"><Pending/></Loading><Loading fallback="two"><Pending/></Loading></>);
 let html="";const ended=new Promise<void>(resolve=>stream.pipe({write(chunk:any){html+=String(chunk)},end:resolve}));await new Promise(r=>setTimeout(r,5));reject(original);await ended;
 ok(reads>=4, "both boundaries re-pull pending reads");equal(heard.length,1);ok(heard[0].error===original);ok(html.includes("repull mapped"));
}));
export const run = (external:typeof configureServerErrors) =>{configureExternal=external;return runCases(cases)};
