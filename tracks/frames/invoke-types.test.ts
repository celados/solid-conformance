import {test,expect} from "bun:test";
import {resolve} from "node:path";
import {mkdir,rm} from "node:fs/promises";
test("RFC10 invoke public types require options and retain argument tuples",async()=>{
 const dir=resolve(".scratch","invoke-types-"+process.pid);await mkdir(dir,{recursive:true});
 try{
  const file=dir+"/contracts.ts";await Bun.write(file,await Bun.file("tracks/frames/invoke-types.ts.txt").text());
  const process=Bun.spawn(["bun","x","tsc","--ignoreConfig","--noEmit","--strict","--module","ESNext","--moduleResolution","Bundler","--target","ES2022","--lib","ES2022,DOM",file],{stdout:"pipe",stderr:"pipe"});
  const [out,err,exit]=await Promise.all([new Response(process.stdout).text(),new Response(process.stderr).text(),process.exited]);
  expect(out+err).toBe("");expect(exit).toBe(0);
 }finally{await rm(dir,{recursive:true,force:true})}
},30000);
