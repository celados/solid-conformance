import { test, expect } from "bun:test";
import { resolve } from "node:path";
import { rm } from "node:fs/promises";
import { build, type BuildMode } from "../../scripts/build";
test("RFC12 only ambient hook hears direct in-process invocation", async()=>{
 const dir=resolve(".build","finding031-"+process.pid);
 try{
  await build(dir,(process.env.BUILD_MODE??"development") as BuildMode,{client:[],server:["findings/031-direct-error-hook-tier/server.tsx"]});
  const module=await import(dir+"/server.js"),result=module.run();
  expect(result.html).toContain("local</b>");
  expect(result.direct).toBe(true);expect(result.kind).toBe("server-function");expect(result.id).toBe("direct-hook");expect(result.original).toBe(true);
  expect(result.ambient).toBe(1);
  expect(result.local).toBe(0);
 }finally{await rm(dir,{recursive:true,force:true})}
});
