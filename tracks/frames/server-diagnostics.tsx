import { OBSERVE, Loading, Errored, createMemo, createComponent } from "solid-js";
import {
  isDev,
  renderToStream,
  dynamic,
  markSafeError,
  RequestContext,
  createRequestEvent,
  ssr,
  escape,
  configureServerErrors,
  renderToString,
  createSSRResponse,
  getRequestEvent,
  getTraceContext,
  redirect,
  commitEventResponse,
  composeMiddleware,
  parseCookieHeader,
  serializeCookie,
} from "@solidjs/web";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  registerServerReference,
  createServerReference,
  handleServerFunctionRequest,
  decodeResponse,
  REDIRECT_HEADER,
} from "@solidjs/web/server-functions/server";
import { renderServerComponent, frameTransformResult } from "@solidjs/web/frames/server";
import { equal, ok, type DocCase, runCases } from "../docs/registry";
const scope = new AsyncLocalStorage<any>();
(globalThis as any)[RequestContext] = scope;
const cases: DocCase[] = [];
const doc = (id: string, statement: string, run: DocCase["run"]) =>
  cases.push({ id: "08/server-road-" + id, file: "08-dev-diagnostics.md", statement, run });
async function observed(run: () => unknown | Promise<unknown>) {
  const session = OBSERVE?.diagnostics.capture();
  const messages: string[] = [];
  const previous = [console.warn, console.error, console.info];
  console.warn =
    console.error =
    console.info =
      (...args) => {
        messages.push(args.map(String).join(" "));
      };
  try {
    await run();
    await new Promise((r) => setTimeout(r, 10));
    return { events: session?.events.slice() ?? [], messages };
  } finally {
    session?.stop();
    [console.warn, console.error, console.info] = previous as any;
  }
}
const selected = (result: Awaited<ReturnType<typeof observed>>, code: string) =>
  result.events.filter((e) => e.code === code);
function assertFinding(result: Awaited<ReturnType<typeof observed>>, code: string, count = 1) {
  const events = selected(result, code);
  equal(events.length, OBSERVE ? count : 0);
  for (const event of events) equal(event.kind, "ssr");
  return events;
}

// RFC 08 L581: handling=fallback, original thrown value, thrown/met owner paths.
doc(
  "contained-fallback",
  "Errored contains a server throw; data.error retains its identity and handling names fallback.",
  async () => {
    const original = new Error("private-contained");
    let html = "";
    function Broken(): never {
      throw original;
    }
    const result = await observed(async () => {
      html = await renderToStream(
        () => (
          <Errored fallback={() => <b>handled</b>}>
            <Broken />
          </Errored>
        ),
        { onError: () => {} },
      );
    });
    ok(html.includes("handled"));
    const events = assertFinding(result, "SSR_RENDER_ERROR_CONTAINED");
    if (OBSERVE) {
      equal(events[0]!.data?.handling, "fallback");
      ok(events[0]!.data?.error === original);
      equal(events[0]!.severity, "error");
      if (isDev) ok(JSON.stringify(events[0]!.ownerPath).includes("Broken"));
      ok(events[0]!.data?.boundary);
      if (isDev) ok(Array.isArray(events[0]!.data?.boundaryPath));
    }
    equal(
      result.messages.some((m) => m.includes("SSR_RENDER_ERROR_CONTAINED")),
      isDev,
    );
  },
);
doc(
  "contained-client",
  "A post-shell Loading rejection names handling:client, the boundary id, and the original throw.",
  async () => {
    let reject!: (reason: unknown) => void;
    const original = new Error("private-fragment");
    const pending = new Promise<string>((_r, j) => {
      reject = j;
    });
    function Pending() {
      const value = createMemo(() => pending);
      return <span>{value()}</span>;
    }
    const result = await observed(async () => {
      const stream = renderToStream(
        () => (
          <Loading fallback="loading">
            <Pending />
          </Loading>
        ),
        { onError: () => {} },
      );
      stream.pipe({ write() {}, end() {} });
      await new Promise((r) => setTimeout(r, 5));
      reject(original);
      await stream;
    });
    const events = assertFinding(result, "SSR_RENDER_ERROR_CONTAINED");
    if (OBSERVE) {
      equal(events[0]!.data?.handling, "client");
      ok(events[0]!.data?.error === original);
      ok(events[0]!.data?.boundary);
    }
    assertFinding(result, "SSR_SUBTREE_ABANDONED", 0);
  },
);
// Initial-pass structured record is the isolated red oracle in finding 017.
// The hook's failed routing remains a passing public-policy contract.
doc(
  "initial-failed-hook",
  "Initial synchronous failure is reported as render/failed before it is rethrown to the caller.",
  async () => {
    const original = new Error("private-root");
    const reports: any[] = [];
    let thrown: unknown;
    await observed(() => {
      try {
        renderToStream(
          () => {
            throw original;
          },
          { onError: (error, site) => reports.push([error, site.kind, site.handling]) },
        );
      } catch (error) {
        thrown = error;
      }
    });
    ok(thrown === original);
    equal(reports, [[original, "render", "failed"]]);
  },
);
for (const reason of ["consumer", "sink", "signal"] as const) {
  doc(
    "abandoned-" + reason,
    "A pending response abandoned by " +
      reason +
      " reports reason, shellFlushed and pendingFragments without ownerPath.",
    async () => {
      function Pending() {
        const value = createMemo(() => new Promise<string>(() => {}));
        return <span>{value()}</span>;
      }
      const controller = new AbortController();
      const result = await observed(async () => {
        const stream = renderToStream(
          () => (
            <Loading fallback="loading">
              <Pending />
            </Loading>
          ),
          { signal: controller.signal, onError: () => {} },
        );
        if (reason === "consumer") {
          const reader = stream.readable.getReader();
          await reader.read();
          await reader.cancel();
        } else if (reason === "signal") {
          const reader = stream.readable.getReader();
          await reader.read();
          controller.abort();
          await reader.cancel();
        } else {
          stream.pipe({
            write() {
              throw new Error("sink unavailable");
            },
            end() {},
          });
          await new Promise((r) => setTimeout(r, 10));
        }
      });
      const events = assertFinding(result, "SSR_STREAM_ABANDONED");
      if (OBSERVE) {
        equal(events[0]!.data?.reason, reason);
        equal(events[0]!.data?.shellFlushed, reason !== "sink");
        equal(events[0]!.data?.pendingFragments, 1);
        equal(events[0]!.ownerPath, undefined);
        equal(events[0]!.severity, "warn");
      }
    },
  );
}
doc(
  "clean-render",
  "A successful completed render has no containment or abandonment findings.",
  async () => {
    const result = await observed(async () => {
      await renderToStream(() => (
        <Loading fallback="loading">
          <span>ready</span>
        </Loading>
      ));
    });
    for (const code of [
      "SSR_RENDER_ERROR_CONTAINED",
      "SSR_SUBTREE_ABANDONED",
      "SSR_STREAM_ABANDONED",
      "SERVER_ERROR_SANITIZED",
    ])
      assertFinding(result, code, 0);
  },
);
doc(
  "dynamic-client-function",
  "An async dynamic source landing on a client component rejects in every tier and identifies the function.",
  async () => {
    function ClientOnly() {
      return <b />;
    }
    let errors: unknown[] = [];
    const C = dynamic(() => Promise.resolve(ClientOnly));
    const result = await observed(async () => {
      await renderToStream(
        () => (
          <Loading fallback="loading">
            <C />
          </Loading>
        ),
        { onError: (e) => errors.push(e) },
      );
    });
    const events = assertFinding(result, "DYNAMIC_ASYNC_COMPONENT");
    if (OBSERVE) {
      equal(events[0]!.severity,"error");
      equal(events[0]!.data?.component, "ClientOnly");
      equal(events[0]!.ownerPath, undefined);
    }
    ok(errors.some((e) => String(e).includes("DYNAMIC_ASYNC_COMPONENT")));
  },
);
doc(
  "dynamic-safe-values",
  "Sync component functions and async tag names never trigger DYNAMIC_ASYNC_COMPONENT.",
  async () => {
    function Sync() {
      return <b>sync</b>;
    }
    const S = dynamic(() => Sync);
    const Tag = dynamic(() => Promise.resolve("div"));
    const result = await observed(async () => {
      await renderToStream(() => (
        <Loading fallback="loading">
          <S />
          <Tag>async-tag</Tag>
        </Loading>
      ));
    });
    assertFinding(result, "DYNAMIC_ASYNC_COMPONENT", 0);
  },
);
for (const safe of [false, true]) {
  doc(
    "sanitize-rpc-" + safe,
    "Server-function wire sanitization preserves safe errors and records originals only in non-dev observe builds.",
    async () => {
      const original = Object.assign(new TypeError("private-database"), { secret: "private-key" });
      if (safe) markSafeError(original);
      const id = "road-rpc-" + safe;
      registerServerReference(id, () => {
        throw original;
      });
      let wire: any;
      const result = await observed(async () => {
        const response = await handleServerFunctionRequest(
          new Request("http://test/_server/data/" + id, {
            method: "POST",
            body: "[]",
            headers: {
              origin: "http://test",
              "content-type": "application/json",
              "X-Server-Function-Format": "8",
            },
          }),
          { onError: () => {} },
        );
        wire = await decodeResponse(response).catch((e) => e);
      });
      equal(wire.message, safe || isDev ? "private-database" : "Internal Server Error");
      const events = selected(result, "SERVER_ERROR_SANITIZED");
      for(const event of events) equal(event.kind,"ssr");
      equal(events.length, OBSERVE && !isDev && !safe ? 1 : 0);
      if (events.length) {
        equal(events[0]!.severity, "error");
        equal(events[0]!.data?.source, "server-function");
        ok(events[0]!.data?.error === original);
        equal((events[0]!.data?.wire as Error).message, "Internal Server Error");
      }
      equal(
        result.messages.some((m) => m.includes("SERVER_ERROR_SANITIZED")),
        false,
      );
    },
  );
  doc(
    "sanitize-ssr-" + safe,
    "Errored sanitizes before fallback rendering; serialized fallback agrees with wire and safe errors are unreported.",
    async () => {
      const original = new Error("private-render");
      if (safe) markSafeError(original);
      let text = "";
      let fallback:unknown;
      function Broken(): never {
        throw original;
      }
      const result = await observed(async () => {
        text = await renderToStream(
          () => (
            <Errored fallback={(error) => {fallback=error();return <b>{String(fallback)}</b>}}>
              <Broken />
            </Errored>
          ),
          { onError: () => {} },
        );
      });
      ok(text.includes(safe || isDev ? "private-render" : "Internal Server Error"));
      if (!safe && !isDev) equal(text.includes("private-render"), false);
      const events = selected(result, "SERVER_ERROR_SANITIZED");
      equal(events.length, OBSERVE && !isDev && !safe ? 1 : 0);
      if (events.length) {
        equal(events[0]!.severity, "info");
        equal(events[0]!.data?.source, "ssr");
        ok(events[0]!.data?.error === original);
        ok(events[0]!.data?.wire === fallback);
        const contained=assertFinding(result,"SSR_RENDER_ERROR_CONTAINED");equal(contained[0]!.severity,"error");ok(contained[0]!.data?.error===original);
      }
    },
  );
}
doc(
  "error-value-data",
  "An Error used as data rather than thrown preserves its authored properties without sanitization.",
  async () => {
    const original = new Error("authored-data");
    const fn = createServerReference(registerServerReference("error-as-data", () => original));
    const result = await observed(async () => {
      const response = await handleServerFunctionRequest(
        new Request("http://test/_server/data/error-as-data", {
          method: "POST",
          body: "[]",
          headers: {
            origin: "http://test",
            "content-type": "application/json",
            "X-Server-Function-Format": "8",
          },
        }),
      );
      const value: any = await decodeResponse(response);
      equal(value.message, "authored-data");
    });
    assertFinding(result, "SERVER_ERROR_SANITIZED", 0);
  },
);
doc(
  "subtree-abandoned-fields",
  "A failed parent fragment discards pending nested fragments and serialized values, naming its original error and collateral counts.",
  async () => {
    const original = new Error("parent-collateral");
    let reject!: (error: unknown) => void;
    const fail = new Promise<string>((_r, j) => {
      reject = j;
    });
    function Nested() {
      const value = createMemo(() => new Promise<string>(() => {}));
      return <span>{value()}</span>;
    }
    function Parent() {
      const value = createMemo(() => fail);
      return (
        <section>
          <Loading fallback="nested">
            <Nested />
          </Loading>
          <b>{value()}</b>
        </section>
      );
    }
    const result = await observed(async () => {
      const stream = renderToStream(
        () => (
          <Loading fallback="outer">
            <Parent />
          </Loading>
        ),
        { onError() {} },
      );
      const done = new Promise<void>((resolve) => stream.pipe({ write() {}, end: resolve }));
      await new Promise((r) => setTimeout(r, 10));
      reject(original);
      await done;
    });
    const events = assertFinding(result, "SSR_SUBTREE_ABANDONED");
    if (events.length) {
      equal(events[0]!.severity, "warn");
      ok(events[0]!.data?.error === original);
      ok(typeof events[0]!.data?.fragment === "string");
      equal(events[0]!.data?.fragments, 1);
      ok((events[0]!.data?.serialized as number) >= 1);
    }
  },
);
for (const road of ["frame-root", "frame-fragment", "frame-live-hole", "async-source"] as const)
  doc(
    "sanitize-" + road,
    "SSR error sanitization covers " +
      road +
      " and retains the original only on the observation channel.",
    async () => {
      const original = Object.assign(new TypeError("private-" + road), { secret: "private-key" });
      let wire = "";
      const result = await observed(async () => {
        function Rejected() {
          const value = createMemo(() => Promise.reject(original), { ssrSource: "server" });
          return road === "frame-live-hole" ? (
            ssr(["<span>", "</span>"], () => escape(value()))
          ) : (
            <span>{value()}</span>
          );
        }
        if (road === "async-source") {
          wire = await renderToStream(
            () => (
              <Loading fallback="loading">
                <Rejected />
              </Loading>
            ),
            { onError() {} },
          );
        } else {
          const chunks: any[] = [];
          const stream = renderServerComponent(
            road === "frame-root"
              ? () => {
                  throw original;
                }
              : () => (
                  <Loading fallback="loading">
                    <Rejected />
                  </Loading>
                ),
            { live: road === "frame-live-hole", frame: { id: road }, onError() {} },
          );
          await new Promise<void>((resolve) =>
            stream.pipe({ write: (c) => chunks.push(c), end: resolve }),
          );
          wire = JSON.stringify(chunks);
        }
      });
      ok(
        wire.includes(isDev ? "private-" + road : "Internal Server Error"),
        road + " wire: " + wire,
      );
      if (!isDev) ok(!wire.includes("private-key"));
      const events = selected(result, "SERVER_ERROR_SANITIZED");
      equal(events.length, OBSERVE && !isDev ? 1 : 0);
      for (const event of events) {
        equal(event.kind, "ssr");
        equal(event.severity, "info");
        equal(event.data?.source, "ssr");
        ok(event.data?.error === original);
        equal((event.data?.wire as Error).message, "Internal Server Error");
      }
    },
  );
// RFC08 L615/L619: original identity, authored replacement and repeated-road deduplication.
doc("hook-wire-and-repeated-roads", "The observer records the original once per wire policy; the hook controls the exact SSR replacement across repeated boundaries.", async()=>{
 const original=new Error("private repeat"),replacement=new Error("public replacement");let calls=0;const values:unknown[]=[];
 configureServerErrors({onError:()=>{calls++;return replacement}});
 try{const result=await observed(()=>{function Broken():never{throw original};const html=renderToString(()=><><Errored fallback={e=>{values.push(e());return <b>{(e() as Error).message}</b>}}><Broken/></Errored><Errored fallback={e=>{values.push(e());return <b>{(e() as Error).message}</b>}}><Broken/></Errored></>);ok(html.includes("public replacement"));ok(!html.includes("private repeat"))});equal(calls,1);equal(values.length,2);ok(values.every(v=>v===replacement));const sanitized=selected(result,"SERVER_ERROR_SANITIZED");equal(sanitized.length,OBSERVE?1:0);for(const e of sanitized){equal(e.kind,"ssr");equal(e.severity,"info");equal(e.data?.source,"ssr");ok(e.data?.error===original);ok(e.data?.wire===replacement)}
 }finally{configureServerErrors({})}
});
doc("explicit-component-owner-path", "Explicit public component source names locate the thrown owner and its catching boundary in both observed server tiers.",async()=>{
 const original=new Error("labelled throw");let html="";
 function Broken():never{throw original}
 function Page(){return createComponent(Errored,{fallback:()=>"caught",get children(){return createComponent(Broken,{},"Broken")}},"Boundary")}
 function App(){return createComponent(Page,{},"Page")}
 const result=await observed(()=>{html=renderToString(()=>createComponent(App,{},"App"),{onError(){}})});ok(html.includes("caught"));
 const events=assertFinding(result,"SSR_RENDER_ERROR_CONTAINED");if(OBSERVE){const e=events[0]!;ok(e.data?.error===original);equal(e.ownerPath,["<App>","<Page>","<Boundary>","<Broken>"]);equal(e.data?.boundaryPath,["<App>","<Page>","<Boundary>"]);ok(e.data?.boundary);equal(e.severity,"error")}
});
doc("late-head-write", "A post-flush header write loses its value and emits head/error with method, name, and the named late component; dev throws, other tiers log.",async()=>scope.run(createRequestEvent(new Request("http://localhost/")),async()=>{
 let release!:()=>void;const promise=new Promise<string>(r=>release=()=>r("ready"));const errors:unknown[]=[];let response!:Response;
 function Late(){const value=createMemo(()=>promise);return <b>{(()=>{const v=value();getRequestEvent()!.response.headers.set("x-late","lost");return v})()}</b>}
 const result=await observed(async()=>{const stream=renderToStream(()=>createComponent(Loading,{fallback:"waiting",get children(){return createComponent(Late,{},"Late")}},"Loading"),{onError:e=>errors.push(e)});response=await createSSRResponse(stream,getRequestEvent()!);equal(response.headers.get("x-late"),null);release();await response.text()});const events=selected(result,"LATE_HEADER_WRITE");equal(events.length,OBSERVE?1:0);for(const e of events){equal(e.kind,"head");equal(e.severity,"error");equal(e.data?.method,"set");equal(e.data?.name,"x-late");equal(e.ownerPath,["<Loading>","<Late>"])}equal(response.headers.get("x-late"),null);equal(errors.length,isDev?1:0);equal(result.messages.filter(m=>m.startsWith("[LATE_HEADER_WRITE]")).length,1);if(isDev)equal((errors[0] as Error).message,events[0]!.message);
}));
doc("live-request-event-identity", "Invocation and render records carry the original ambient RequestEvent and trace beside serializable events.",async()=>{
 const event=createRequestEvent(new Request("http://localhost/identity"));const result={value:17};const invocations:any[]=[],renders:any[]=[];const offI=OBSERVE?.records.subscribe("invocation",(event,live)=>invocations.push({event,live}));const offR=OBSERVE?.records.subscribe("render",(event,live)=>renders.push({event,live}));let trace:unknown,invocationEvent:any;
 try{await scope.run(event,()=>{trace=getTraceContext();const fn=createServerReference(registerServerReference("live-event-identity",(n:number)=>{invocationEvent=getRequestEvent();equal(n,3);return result}));const html=renderToString(()=>{ok(fn(3)===result);return "rendered"});equal(html,"rendered")});equal(invocations.length,OBSERVE?1:0);equal(renders.length,OBSERVE?1:0);if(OBSERVE){const i=invocations[0];ok(i.live.event===invocationEvent,"invocation own event identity");ok(invocationEvent!==event);ok(invocationEvent.request===event.request);ok(invocationEvent.response===event.response);equal(i.live.args,[3]);ok(i.live.result===result,"invocation result identity");equal(i.live.request,undefined);equal(i.event.outcome,"ok");ok(renders[0].live.event===event,"render event identity");ok(renders[0].live.trace===trace,"render trace identity")}}finally{offI?.();offR?.()}
});
doc("mutation-cookie-thrown-redirect", "A server mutation response carries staged cookies through a thrown redirect, commits its shared stub, and makes later writes loud.",async()=>{
 let current:any;const id="cookie-redirect";registerServerReference(id,()=>{current=getRequestEvent();current.response.headers.append("set-cookie","a=1; Path=/");current.response.headers.append("set-cookie","b=2; Path=/");current.response.headers.set("x-stub","shared");throw redirect("/next",{status:303})});
 const request=new Request("http://localhost/_server/data/"+id,{method:"POST",body:"[]",headers:{origin:"http://localhost","content-type":"application/json","X-Server-Function-Format":"8"}});const response=await handleServerFunctionRequest(request,{createEvent:createRequestEvent});equal(response.status,200);equal(response.headers.get(REDIRECT_HEADER),"303 http://localhost/next");equal(response.headers.getSetCookie(),["a=1; Path=/","b=2; Path=/"]);equal(response.headers.get("x-stub"),"shared");equal(current.response.committed,true);
 let caught:unknown;const result=await observed(()=>{try{current.response.headers.set("x-after","lost")}catch(e){caught=e}});equal(!!caught,isDev);equal(response.headers.get("x-after"),null);equal(current.response.headers.get("x-after"),null);const events=selected(result,"LATE_HEADER_WRITE");equal(events.length,OBSERVE?1:0);for(const e of events){equal(e.kind,"head");equal(e.severity,"error");equal(e.data,{method:"set",name:"x-after"})}equal(result.messages.filter(m=>m.startsWith("[LATE_HEADER_WRITE]")).length,isDev?0:1);
});
doc("bare-event-trace-commit", "A response-less event adds sampled trace metrics while an unrecorded event returns the original Response untouched.", async()=>{
 for(const sampled of [true,false]){
  const parent="00-1234567890abcdef1234567890abcdef-1234567890abcdef-"+(sampled?"01":"00");
  const event={request:new Request("http://localhost/bare",{headers:{traceparent:parent}}),locals:{}};
  await scope.run(event,async()=>{const original=new Response("body",{status:201,headers:{"x-own":"preserved","server-timing":"app;dur=3"}});const trace=getTraceContext()!;equal(trace.traceId,"1234567890abcdef1234567890abcdef");const response=commitEventResponse(original,event as any);equal(response.status,201);equal(response.headers.get("x-own"),"preserved");equal(await response.text(),"body");equal(original.headers.get("server-timing"),"app;dur=3");if(sampled){ok(response!==original);ok(response.headers.get("server-timing")!.includes('traceparent;desc="'+trace.entries.traceparent+'"'));ok(response.headers.get("server-timing")!.includes("app;dur=3"))}else{ok(response===original);equal(response.headers.get("server-timing"),"app;dur=3")}});
 }
});
doc("server-function-forward-trace", "The public server-function recipe forwards the current request span as W3C traceparent to a real downstream HTTP service in every tier.",async()=>{
 let received="";const downstream=Bun.serve({hostname:"127.0.0.1",port:0,fetch(request){received=request.headers.get("traceparent")??"";return new Response("downstream")}});
 let current:any;registerServerReference("forward-trace",async()=>{const trace=getTraceContext()!;current=trace;const response=await fetch(downstream.url,{headers:trace?{traceparent:trace.entries.traceparent!}:{}});return response.text()});
 try{const parent="00-1234567890abcdef1234567890abcdef-1234567890abcdef-00";const request=new Request("http://localhost/_server/data/forward-trace",{method:"POST",body:"[]",headers:{origin:"http://localhost","content-type":"application/json","X-Server-Function-Format":"8",traceparent:parent}});const response=await handleServerFunctionRequest(request,{createEvent:createRequestEvent});equal(response.status,200);ok((await response.text()).includes("downstream"));equal(received,current.entries.traceparent);equal(received,"00-1234567890abcdef1234567890abcdef-"+current.spanId+"-00");equal(current.parentId,"1234567890abcdef");ok(current.spanId!==current.parentId);ok(!response.headers.get("server-timing")?.includes("traceparent"));}finally{await downstream.stop(true)}
});
doc("invocation-settle-timing", "A synchronous invocation emits before return; a promise invocation emits once only after resolution.",async()=>{
 const rows:any[]=[];const off=OBSERVE?.records.subscribe("invocation",(event,live)=>rows.push({event,live}));const sync=createServerReference(registerServerReference("timing-sync",()=>17));let release!:(value:number)=>void;const gate=new Promise<number>(r=>release=r);const asyncFn=createServerReference(registerServerReference("timing-promise",()=>gate));
 try{equal(sync(),17);equal(rows.length,OBSERVE?1:0);if(OBSERVE){equal(rows[0].event.id,"timing-sync");equal(rows[0].event.outcome,"ok");equal(rows[0].live.result,17)}rows.length=0;const pending=asyncFn();await Promise.resolve();equal(rows.length,0);release(23);equal(await pending,23);equal(rows.length,OBSERVE?1:0);if(OBSERVE){equal(rows[0].event.id,"timing-promise");equal(rows[0].event.outcome,"ok");equal(rows[0].live.result,23)}}finally{release(23);off?.()}
});
doc("invocation-deferred-handoff-clock", "An async-iterable record measures the handoff and never grows while its later chunks wait.",async()=>{
 let clock=1000;const descriptor=Object.getOwnPropertyDescriptor(performance,"now");Object.defineProperty(performance,"now",{configurable:true,value:()=>clock});const rows:any[]=[];const off=OBSERVE?.records.subscribe("invocation",(event,live)=>rows.push({event,live}));let release!:()=>void;const gate=new Promise<void>(r=>release=r);const iterable={async *[Symbol.asyncIterator](){await gate;yield 31}};const fn=createServerReference(registerServerReference("timing-iterable",()=>{clock=1100;return iterable}));
 try{const result=fn() as AsyncIterable<number>;equal(rows.length,OBSERVE?1:0);if(OBSERVE){equal(rows[0].event.at,1000);equal(rows[0].event.durationMs,100);equal(rows[0].event.deferred,true);ok(rows[0].live.result===iterable)}const iterator=result[Symbol.asyncIterator]();const pending=iterator.next();clock=6100;await Promise.resolve();equal(rows.length,OBSERVE?1:0);release();equal(await pending,{value:31,done:false});await iterator.return?.();if(OBSERVE)equal(rows[0].event.durationMs,100);equal(rows.length,OBSERVE?1:0)}finally{release();off?.();if(descriptor)Object.defineProperty(performance,"now",descriptor);else delete(performance as any).now}
});
doc("cookie-exchange-three-domains", "The same request-header/read and response-header/append recipe composes in server functions, SSR handlers and middleware.",async()=>{
 const requestFor=(path:string)=>new Request("http://localhost/"+path,{headers:{cookie:"session=previous"}});
 function exchange(){const event=getRequestEvent()!;equal(parseCookieHeader(event.request.headers.get("cookie")),{session:"previous"});event.response.headers.append("set-cookie",serializeCookie("session","refreshed",{httpOnly:true}));event.response.headers.append("set-cookie",serializeCookie("csrf","second"));equal(parseCookieHeader(event.request.headers.get("cookie")),{session:"previous"})}
 const expected=["session=refreshed; Path=/; HttpOnly","csrf=second; Path=/"];
 registerServerReference("three-domain-cookie",()=>{exchange();return "server-function"});const response=await handleServerFunctionRequest(new Request(requestFor("_server/data/three-domain-cookie"),{method:"POST",body:"[]",headers:{cookie:"session=previous",origin:"http://localhost","content-type":"application/json","X-Server-Function-Format":"8"}}),{createEvent:createRequestEvent});equal(response.headers.getSetCookie(),expected);
 await scope.run(createRequestEvent(requestFor("ssr")),()=>{const html=renderToString(()=>{exchange();return "ssr"});const response=createSSRResponse(html,getRequestEvent()!);equal(response.headers.getSetCookie(),expected);equal(response.status,200)});
 await scope.run(createRequestEvent(requestFor("middleware")),async()=>{const run=composeMiddleware([async(_request,next)=>{exchange();const response=await next();equal(getRequestEvent()!.response.committed,false);return response}]);const response=commitEventResponse(await run(getRequestEvent()!.request,()=>new Response("middleware")));equal(response.headers.getSetCookie(),expected);equal(getRequestEvent()!.response.committed,true);equal(await response.text(),"middleware")});
});
doc("trace-every-response-face", "Sampled trace travels through document shell splice, onHead, headless fragments, frame RPC and redirects without echoing incoming baggage.",async()=>{
 const headers={traceparent:"00-1234567890abcdef1234567890abcdef-1234567890abcdef-01",baggage:"private=upstream"};
 for(const mode of ["splice","onHead","headless"] as const){await scope.run(createRequestEvent(new Request("http://localhost/trace",{headers})),()=>{let head="";const event=getRequestEvent()!;event.response.headers.set("server-timing","application;dur=2");const trace=getTraceContext()!;const html=renderToString(()=>mode!=="splice"?"fragment":<html><head/><body>document</body></html>,mode==="onHead"?{onHead:value=>{head=value}}:{});const response=createSSRResponse(html,event);const metric=response.headers.get("server-timing")!;ok(metric.includes('traceparent;desc="'+trace.entries.traceparent+'"'));ok(metric.includes("application;dur=2"));ok(!metric.includes("private=upstream"));ok(!html.includes("private=upstream"));const meta='<meta name="traceparent" content="'+trace.entries.traceparent+'"';if(mode==="onHead")ok(head.includes(meta),head);else if(mode==="splice")ok(html.includes(meta),html);else ok(!html.includes('name="traceparent"'))})}
 let current:any;registerServerReference("trace-frame",()=>{current=getTraceContext();return ()=> <b>framed</b>});const request=new Request("http://localhost/_server/data/trace-frame",{method:"POST",body:"[]",headers:{...headers,origin:"http://localhost","content-type":"application/json","X-Server-Function-Format":"8"}});const response=await handleServerFunctionRequest(request,{createEvent:createRequestEvent,transformResult:frameTransformResult});ok(response.headers.get("server-timing")!.includes('traceparent;desc="'+current.entries.traceparent+'"'));ok((await response.text()).includes("framed"));ok(!response.headers.get("server-timing")!.includes("private=upstream"));
 await scope.run(createRequestEvent(new Request("http://localhost/redirect",{headers})),()=>{const event=getRequestEvent()!;const trace=getTraceContext()!;event.response.headers.set("location","/next");const response=createSSRResponse("discarded",event);equal(response.status,302);equal(response.body,null);ok(response.headers.get("server-timing")!.includes('traceparent;desc="'+trace.entries.traceparent+'"'))});
});
export const run = () =>
  scope.run(createRequestEvent(new Request("http://test/")), () => runCases(cases));
