import {test,expect} from 'bun:test';
import {resolve} from 'node:path';
import {mkdir,rm} from 'node:fs/promises';
test('RFC10 migration target evidence: released Start GET belongs to its Solid1 adapter line',async()=>{
 const dir=resolve('.scratch','start-contract-'+process.pid);await mkdir(dir,{recursive:true});
 try{
  for(const name of ['package.json','bun.lock'])await Bun.write(dir+'/'+name,await Bun.file('tracks/frames/start-public/'+name).text());
  await Bun.write(dir+'/contracts.ts',await Bun.file('tracks/frames/start-public/contracts.ts.txt').text());
  const install=Bun.spawn(['bun','install','--frozen-lockfile'],{cwd:dir,stdout:'pipe',stderr:'pipe'});const [out,err,exit]=await Promise.all([new Response(install.stdout).text(),new Response(install.stderr).text(),install.exited]);expect(exit,out+err).toBe(0);
  const pkg=await Bun.file(dir+'/node_modules/@solidjs/start/package.json').json();expect(pkg.version).toBe('2.0.5');expect(pkg.dependencies['solid-js']).toBe('^1.9.15');expect(pkg.peerDependencies['@solidjs/router']).toBe('>=0.16.0 <2.0.0-0');
  const compile=Bun.spawn(['bun','x','tsc','--ignoreConfig','--noEmit','--strict','--skipLibCheck','--module','ESNext','--moduleResolution','Bundler','--target','ES2022','--jsx','preserve',dir+'/contracts.ts'],{stdout:'pipe',stderr:'pipe'});const [compilerOut,compilerErr,compilerExit]=await Promise.all([new Response(compile.stdout).text(),new Response(compile.stderr).text(),compile.exited]);expect(compilerOut+compilerErr).toBe('');expect(compilerExit).toBe(0);
 }finally{await rm(dir,{recursive:true,force:true})}
},30000);
