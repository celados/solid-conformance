import {mkdir, rm, symlink} from 'node:fs/promises'
import {resolve} from 'node:path'
const root = process.cwd(), core = await Bun.file('.upstream/built.json').json(), routerHead = await Bun.file('.upstream/router-built.json').json()
const names = ['solid-js', '@solidjs/web', '@solidjs/signals', '@solidjs/compiler', '@solidjs/diagnostics']
const folders = ['solid', 'web', 'signals', 'compiler', 'diagnostics']
const results: unknown[] = []
async function run(command: string[], cwd: string, env: Record<string, string | undefined>, log: string) {
 const child = Bun.spawn(command, {cwd, env: {...process.env, ...env}, stdout: 'pipe', stderr: 'pipe'})
 const [out, err, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
 await Bun.write(log, out+err)
 return {pid: child.pid, exitCode, output: out+err}
}
for (const version of ['rc10', 'rc13', 'rc14', 'rc15', 'head']) {
 const directory = resolve('.scratch/bisect', version)
 await mkdir(directory, {recursive: true})
 for (const path of ['scripts/build.ts', 'harness/client-page.ts', 'harness/preload.ts', 'harness/runtime.ts', 'tsconfig.json', 'bunfig.toml', 'tracks/transitions/wave5-client.tsx', '.scratch/probe.test.ts']) {
  await Bun.write(directory+'/'+path, Bun.file(root+'/'+path))
 }
 await Bun.write(directory+'/package.json', JSON.stringify({type: 'module', private: true}))
 const installed = version === 'head' ? '2.0.0-rc.15' : `2.0.0-${version.replace('rc', 'rc.')}`
 const install = await run(['bun', 'add', '--exact', ...names.map(name=>name+'@'+installed), '@solidjs/router@2.0.0-next.30', 'playwright@'+(await Bun.file('node_modules/playwright/package.json').json()).version], directory, {}, directory+'/install.log')
 if (install.exitCode) throw new Error(install.output)
 if (version === 'head') {
  for (let i=0;i<names.length;i++) {await rm(directory+'/node_modules/'+names[i], {recursive: true, force: true}); await symlink(core.directory+'/packages/'+folders[i], directory+'/node_modules/'+names[i], 'dir')}
  await Bun.write(directory+'/.upstream/active.json', JSON.stringify(core))
 }
 for (const router of ['next.30', 'next.39', 'head']) {
  if (router !== 'next.30') {
   if (router === 'head') {await rm(directory+'/node_modules/@solidjs/router',{recursive:true,force:true});await symlink(routerHead.directory,directory+'/node_modules/@solidjs/router','dir');await Bun.write(directory+'/.upstream/router-built.json',JSON.stringify(routerHead))}
   else {const result=await run(['bun','add','--exact','@solidjs/router@2.0.0-'+router],directory,{},directory+'/router-install.log');if(result.exitCode)throw new Error(result.output)
    // Bun may reify release dependencies while changing Router; restore the pinned HEAD graph.
    if(version==='head')for(let i=0;i<names.length;i++){await rm(directory+'/node_modules/'+names[i],{recursive:true,force:true});await symlink(core.directory+'/packages/'+folders[i],directory+'/node_modules/'+names[i],'dir')}
   }
  }
  for (const mode of ['development','production']) {
   const log = `report/evidence/wave5-bisect/${version}-${router}-${mode}.log`
   const result = await run(['bun','test','./.scratch/probe.test.ts'],directory,{TARGET:version,BUILD_MODE:mode},root+'/'+log)
   const line = result.output.split('\n').find(line=>line.startsWith('{"router":'))
   results.push({version,router,mode,pid:result.pid,exitCode:result.exitCode,probe:line?JSON.parse(line):null,log})
   await Bun.write(root+'/report/evidence/wave5-bisect.json',JSON.stringify({core,routerHead,results},null,2)+'\n')
   console.log(JSON.stringify(results.at(-1)))
  }
 }
}
