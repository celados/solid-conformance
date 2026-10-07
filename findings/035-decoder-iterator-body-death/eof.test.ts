import {test,expect} from "bun:test";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
test("RFC10 EOF body rejects an open iterator pull",async()=>{
 const dir=resolve(".build","finding035-eof-"+process.pid);
 try{
  await build(dir,(process.env.BUILD_MODE??"development") as BuildMode,{client:[],server:["findings/035-decoder-iterator-body-death/server.ts"]});
  const module=await import(dir+"/server.js"),result=await module.run("eof");
  expect(result.first).toEqual({done:false,value:"first"});expect(result.transportFailed).toBe(true);
  expect(result.outcome.outcome).toBe("rejected");
 }finally{await rm(dir,{recursive:true,force:true})}
},5000);
