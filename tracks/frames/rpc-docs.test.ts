import {test,expect} from "bun:test";
import {resolve} from "node:path";
import {rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
for(const mode of ["development","observe","production"] as BuildMode[])test("RFC10/11 public server contracts "+mode,async()=>{
 const dir=resolve(".build","rpc-docs-"+process.pid+"-"+mode);
 try{
  await build(dir,mode,{client:[],server:["tracks/frames/server.tsx"],serverComponents:true});
  const module=await import(dir+"/server.js"),results=await module.documents();
  await Bun.write("artifacts/rpc-docs-"+mode+".json",JSON.stringify(results,null,2));
  expect(results.length).toBe(73);expect(results.filter((x:any)=>x.error)).toEqual([]);
 }finally{await rm(dir,{recursive:true,force:true})}
},30000);
