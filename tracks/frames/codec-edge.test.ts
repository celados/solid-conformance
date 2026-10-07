import {test,expect} from "bun:test";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
for(const mode of ["development","observe","production"] as BuildMode[])test("RFC10 plugin public instance edge "+mode,async()=>{
 const dir=resolve(".build","codec-edge-"+process.pid+"-"+mode);
 try{
  await build(dir,mode,{client:[],server:["tracks/frames/codec-edge.ts"]});
  await build(dir+"/foreign",mode,{client:[],server:["tracks/frames/codec-edge-foreign.ts"]});
  const target=await import(dir+"/codec-edge.js"),foreign=await import(dir+"/foreign/codec-edge-foreign.js");
  const result=await target.run(foreign.OpaqueReference);
  expect(result.sameConstructor).toBe(false);expect(result.values[0]).toEqual({value:17});expect(result.values[1].error).toBeString();
 }finally{await rm(dir,{recursive:true,force:true})}
},30000);
