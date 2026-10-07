import {test,expect} from "bun:test";
import {resolve} from "node:path";
import {readdir,rm} from "node:fs/promises";
import {build,type BuildMode} from "../../scripts/build";
for(const mode of ["development","observe","production"] as BuildMode[])test("RFC11 opt-in frame bundle machinery "+mode,async()=>{
 const dir=resolve(".build","frames-zero-"+process.pid+"-"+mode);
 try{
  const code:Record<string,string>={};
  for(const variant of ["plain","bare","enabled"]){await build(dir+"/"+variant,mode,{server:[],client:["tracks/frames/zero-bytes/"+variant+".ts"]});code[variant]=(await Promise.all((await readdir(dir+"/"+variant)).filter(p=>p.endsWith(".js")).map(p=>Bun.file(dir+"/"+variant+"/"+p).text()))).join("\n")}
  for(const marker of ["frame:applied","installServerComponents"]){expect(code.plain!.includes(marker)).toBe(false);expect(code.bare!.includes(marker)).toBe(false);expect(code.enabled!.includes(marker)).toBe(true)}
  // Core dynamic interop symbols exist on both graphs; this is a machinery-exclusion oracle, not an exact numeric zero-byte claim.
  expect(code.plain!.includes("solid.component-binding")).toBe(true);
  expect(code.enabled!.length).toBeGreaterThan(code.plain!.length);
 }finally{await rm(dir,{recursive:true,force:true})}
},30000);
