import {mkdir,rm,symlink,realpath} from 'node:fs/promises'
import {resolve} from 'node:path'
async function run(cmd:string[],cwd=process.cwd()){const child=Bun.spawn(cmd,{cwd,stdout:'inherit',stderr:'inherit'});if(await child.exited)throw new Error(cmd.join(' '))}
const ref=process.env.VITE_UPSTREAM_REF??'next'
await mkdir(resolve(".upstream"),{recursive:true})
const upstream=await realpath(resolve(".upstream"))
const archive=resolve(upstream,"vite-plugin-source.tar.gz")
await run(["curl","--max-time","60","-fsSL","https://codeload.github.com/solidjs/solid-vite-plugin/tar.gz/"+encodeURIComponent(ref),"-o",archive])
const header=new TextDecoder().decode(Bun.gunzipSync(new Uint8Array(await Bun.file(archive).arrayBuffer())).slice(0,1024))
const revision=header.match(/comment=([a-f0-9]{40})/)?.[1];if(!revision)throw new Error("Snapshot lacks a commit PAX header")
const directory=resolve(upstream,"vite-plugin",revision);await mkdir(directory,{recursive:true})
await run(["tar","-xzf",archive,"-C",directory,"--strip-components=1"])
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
