import { isServer, renderToStream } from "@solidjs/web";
import { Loading, createMemo, Errored } from "solid-js";
import {
  renderServerComponent,
  asyncArg,
  frameTransformDirectResult,
  frameTransformResult,
  frameTransformFlightResult,
} from "@solidjs/web/frames/server";
import { equal, ok, throws, type DocCase } from "./registry";
import * as rpc from "@solidjs/web/server-functions/server";
const cases: DocCase[] = [];
function doc(name: string, statement: string, run: DocCase["run"]) {
  cases.push({ id: `11/${name}`, file: "11-server-components.md", statement, run });
}
const collect = (component: (p: any) => any, options: any = {}) =>
  Promise.resolve(
    renderServerComponent(component, { frame: { id: "docs-frame", version: 1 }, ...options }),
  );
if (isServer) {
  doc(
    "direct-slot",
    "{props.children} is a direct-insert slot: the server emits a marked range; the client fills it.",
    async () => {
      const cs = await collect((p) => <main>{p.children}</main>);
      ok(cs.find((c) => c.type === "html")?.html.includes("slot:children:start"));
      equal(cs.filter((c) => c.type === "slot").length, 0);
    },
  );
  doc(
    "render-prop-slots",
    "A render-prop slot has one occurrence per call; primitives ride as data.",
    async () => {
      const cs = await collect((p) => (
        <main>
          <p.row cid={1} />
          <p.row cid={2} />
        </main>
      ));
      const slots = cs.filter((c) => c.type === "slot");
      equal(
        slots.map((c) => c.key),
        ["row#0", "row#1"],
      );
      equal(
        slots.map((c) => c.args.cid),
        [1, 2],
      );
    },
  );
  doc(
    "keyed-slots",
    "$key names occurrence identity, is stripped before client props, and keyed occurrences must be siblings.",
    async () => {
      const cs = await collect((p) => (
        <main>
          <p.row $key="b" cid={2} />
          <p.row $key="a" cid={1} />
        </main>
      ));
      const slots = cs.filter((c) => c.type === "slot");
      equal(
        slots.map((c) => c.key),
        ["row#b", "row#a"],
      );
      equal(
        slots.map((c) => c.args.$key),
        [undefined, undefined],
      );
    },
  );
  doc(
    "single-copy",
    "Server content travels as HTML; nothing travels as both HTML and data.",
    async () => {
      const cs = await collect((p) => (
        <article>
          <h1>unique-server-heading</h1>
          <p.row cid={1}>
            <p>unique-nested-content</p>
          </p.row>
        </article>
      ));
      const wire = JSON.stringify(cs);
      equal(wire.split("unique-server-heading").length - 1, 1);
      equal(wire.split("unique-nested-content").length - 1, 1);
      ok(cs.some((c) => c.type === "slot"));
      ok(cs.some((c) => c.type === "html"));
    },
  );
  doc(
    "stream-loading",
    "Loading/async inside server components stream as fragments with fallbacks.",
    async () => {
      const cs = await collect((p) => {
        const value = createMemo(async () => {
          await new Promise((r) => setTimeout(r, 10));
          return "async-content";
        });
        return (
          <Loading fallback={<b>fallback-content</b>}>
            <p>
              {value()}
              {p.children}
            </p>
          </Loading>
        );
      });
      ok(cs.find((c) => c.type === "html")?.html.includes("fallback-content"));
      const fragment = cs.find((c) => c.type === "fragment");
      ok(fragment?.html.includes("async-content"));
      ok(fragment?.html.includes("slot:children:start"));
      equal(cs.find((c) => c.type === "reveal")?.keys, [fragment?.key]);
      equal(cs.at(-1)?.type, "complete");
    },
  );
  doc(
    "async-args",
    "Plain promises cross as pending data records without blocking the server stream.",
    async () => {
      let resolve!: (v: string) => void;
      const pending = new Promise<string>((r) => (resolve = r));
      const stream = renderServerComponent((p) => <p.status progress={asyncArg(pending)} />, {
        frame: { id: "async-args" },
      });
      const chunks: any[] = [];
      stream.pipe({ write: (c) => chunks.push(c) });
      await new Promise((r) => setTimeout(r, 10));
      ok(chunks.some((c) => c.type === "slot"));
      resolve("done");
      await new Promise((r) => setTimeout(r, 20));
      ok(chunks.some((c) => c.type === "data"));
      equal(chunks.at(-1).type, "complete");
    },
  );
  doc(
    "transforms-data",
    "Data-only results retain ordinary server-function result semantics.",
    () => {
      const data = { n: 1 };
      equal(frameTransformDirectResult(data, { id: "data" }), data);
      equal(frameTransformResult(null, data), data);
    },
  );
  doc("response-abort", "The request signal tears the frame render down.", async () => {
    const controller = new AbortController();
    let closed = false;
    async function* source() {
      try {
        yield "first";
        await new Promise<void>((r) =>
          controller.signal.addEventListener("abort", () => r(), { once: true }),
        );
        yield "last";
      } finally {
        closed = true;
      }
    }
    const cs: any[] = [];
    const stream = renderServerComponent(
      () => {
        const value = createMemo(() => source(), { ssrSource: "server" });
        return (
          <Loading fallback={<b>pending</b>}>
            <p>{value()}</p>
          </Loading>
        );
      },
      { signal: controller.signal, live: true, frame: { id: "abort" } },
    );
    stream.pipe({ write: (c) => cs.push(c) });
    await new Promise((r) => setTimeout(r, 20));
    controller.abort();
    await new Promise((r) => setTimeout(r, 20));
    ok(closed);
    ok(cs.some((c) => c.type === "html"));
  });
}
if(isServer) {
 doc("plain-flight-bytes", "Enabling frame flight transforms leaves data-only envelopes byte-identical to plain transport.",async()=>{
  rpc.registerServerReference("frame-byte-equivalence",()=>({mutated:7}));
  const off=rpc.registerFlightDataSource("byte-cache",()=>({fresh:[1,2]}));
  const request=()=>new Request("http://conformance.test/_server/data/frame-byte-equivalence",{method:"POST",body:"[]",headers:{origin:"http://conformance.test","content-type":"application/json","X-Server-Function-Format":"8","X-Single-Flight":"byte-cache"}});
  try {const plain=await rpc.handleServerFunctionRequest(request(),{transformFlightResult:()=>undefined});const framed=await rpc.handleServerFunctionRequest(request(),{transformFlightResult:frameTransformFlightResult});
   const bytes=await plain.text();equal(JSON.parse(bytes),{value:{mutated:7},data:{"byte-cache":{fresh:[1,2]}}});equal(await framed.text(),bytes);equal(framed.headers.get("X-Server-Function-Format"),plain.headers.get("X-Server-Function-Format"));equal(framed.headers.get("X-Single-Flight"),"byte-cache");
  }finally{off()}
 });
 doc("one-render-consumer", "renderToStream permits exactly one consumer mode: pipe, pipeTo, or readable.",async()=>{
  for(const first of ["pipe","pipeTo","readable"] as const)for(const second of ["pipe","pipeTo","readable"] as const){
   if(first===second)continue;
   const render=renderToStream(()=><p>one-consumer</p>);let text="";const writes:any[]=[];
   const pipe=()=>render.pipe({write(chunk:string){text+=chunk},end(){}});
   const pipeTo=()=>render.pipeTo(new WritableStream({write(chunk){writes.push(chunk)}}));
   if(first==="pipe"){pipe();await render;}else if(first==="pipeTo")await pipeTo();else {const readable=render.readable;ok(render.readable===readable,"readable identity "+first+"/"+second);text=await new Response(readable).text()}
   throws(()=>{if(second==="pipe")pipe();else if(second==="pipeTo")pipeTo();else void render.readable},"already consumed");
   if(first!=="pipeTo")ok(text.includes("one-consumer"),"missing output "+first+"/"+second+": "+text);else ok(writes.length>0,"empty pipeTo "+first+"/"+second);
  }
 });
}

export const frameCases = cases;
