import {mkdir,rm,symlink} from 'node:fs/promises'
import {resolve} from 'node:path'
async function run(cmd:string[],cwd=process.cwd()){const child=Bun.spawn(cmd,{cwd,stdout:'inherit',stderr:'inherit'});if(await child.exited)throw new Error(cmd.join(' '))}
const ref=process.env.VITE_UPSTREAM_REF??'next'
const metadata=resolve('.upstream/vite-revision.json');await mkdir(resolve('.upstream'),{recursive:true});await run(['curl','--max-time','30','-fsSL','https://api.github.com/repos/solidjs/solid-vite-plugin/commits/'+encodeURIComponent(ref),'-o',metadata])
const revision=(await Bun.file(metadata).json() as {sha:string}).sha,directory=resolve('.upstream','vite-plugin',revision)
await mkdir(directory,{recursive:true})
await run(['curl','-fsSL','https://codeload.github.com/solidjs/solid-vite-plugin/tar.gz/'+revision,'-o',directory+'/snapshot.tar.gz'])
await run(['tar','-xzf',directory+'/snapshot.tar.gz','-C',directory,'--strip-components=1'])
const pkg=await Bun.file(directory+'/package.json').json()
// Install build tools without Cypress or its browser download; execute upstream rollup directly through Bun.
pkg.devDependencies=Object.fromEntries(Object.entries(pkg.devDependencies).filter(([name])=>name.startsWith('@rollup/')||name.startsWith('@babel/preset-')||['rollup','rollup-plugin-cleaner','typescript','@types/node'].includes(name)))
delete pkg.peerDependencies;delete pkg.scripts.prepublishOnly;delete pkg.scripts.release
await Bun.write(directory+'/package.json',JSON.stringify(pkg,null,2));await run(['bun','install','--ignore-scripts'],directory)
const core=await Bun.file('.upstream/built.json').json()
for(const[name,folder]of [['@solidjs/compiler','compiler'],['@solidjs/babel-plugin','babel-plugin']]){const destination=directory+'/node_modules/'+name;await rm(destination,{recursive:true,force:true});await symlink(core.directory+'/packages/'+folder,destination)}
await run(['bun','x','--no-install','rollup','-c'],directory)
await Bun.write('.upstream/vite-built.json',JSON.stringify({ref,revision,directory,version:pkg.version},null,2))
console.log('Built Vite plugin '+revision)
