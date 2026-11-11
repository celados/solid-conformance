import {mkdtemp, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const source=import.meta.dir, host=await mkdtemp(join(tmpdir(),'solid-rc21-repro-'))
async function run(args:string[]) {const child=Bun.spawn([process.execPath,...args],{cwd:host,stdout:'inherit',stderr:'inherit'});return child.exited}
try {
 for await (const name of new Bun.Glob('**/*').scan({cwd:source,onlyFiles:true,dot:true})) {
  if(name.startsWith('node_modules/')||name.startsWith('.build/')) continue
  await Bun.write(join(host,name),Bun.file(join(source,name)))
 }
 if(await run(['install','--frozen-lockfile'])) throw Error('install failed')
 process.exitCode=await run(['test','./repro.test.ts'])
} finally {await rm(host,{recursive:true,force:true})}
