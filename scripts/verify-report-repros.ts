import {spawn} from 'node:child_process'
import {mkdir,rm,symlink} from 'node:fs/promises'
import {resolve} from 'node:path'

const parent=process.cwd(),target=await Bun.file('.upstream/active.json').json()
const issues=(await Array.fromAsync(new Bun.Glob('report/issues/*.md').scan('.'))).sort()
const root=resolve('.scratch','report-inline-verification')
await mkdir(root,{recursive:true})
const results:any[]=[]
async function verify(path:string){
 const text=await Bun.file(path).text()
 const front=Bun.YAML.parse(text.split('---')[1]!)as any
 if(front.tier!=='A')return
 const name=path.split('/').at(-1)!.replace('.md',''),dir=resolve(root,name)
 await mkdir(dir,{recursive:true})
 const files=[...text.matchAll(/### `([^`]+)`\s*\n\s*```(?:ts|tsx)\n([\s\S]*?)\n```/g)]
 if(!files.length)throw Error('No inline source files '+path)
 for(const [,file,code]of files){
  if(code!.match(/(?:from\s*['"]|import\s*\()['"][^'"]*(?:harness|findings\/|scripts\/build)/))throw Error('Harness import '+path)
  const checked=await Bun.file('report/repros/'+name+'/'+file).text()
  if(checked.trim()!==code!.trim())throw Error('Inline source differs '+path+':'+file)
  await Bun.write(resolve(dir,file!),code+'\n')
 }
 await Bun.write(resolve(dir,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ESNext',module:'ESNext',moduleResolution:'bundler',jsx:'preserve',jsxImportSource:'@solidjs/web',types:['bun']}}))
 await rm(resolve(dir,'node_modules'),{recursive:true,force:true})
 await symlink(resolve(parent,'node_modules'),resolve(dir,'node_modules'))
 const mode=['02-production-refresh','05-production-store-affects'].includes(name)?'production':'development'
 for(const [,file]of files.filter(([,file])=>file!.endsWith('.test.ts'))){
  const output:string[]=[],started=performance.now()
  const child=spawn(process.execPath,['test','./'+file],{cwd:dir,env:{...process.env,BUILD_MODE:mode},detached:true,stdio:['ignore','pipe','pipe']})
  child.stdout.on('data',x=>output.push(String(x)));child.stderr.on('data',x=>output.push(String(x)))
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid!,'SIGKILL')}catch{}},120000)
  const exitCode=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)}).finally(()=>clearTimeout(timer))
  const log=output.join(''),logPath='report/evidence/standalone/'+name+'-'+file+'.log'
  await Bun.write(logPath,log)
  const result={issue:path,test:file,mode,exitCode,timedOut,pass:Number(log.match(/^\s*(\d+) pass$/m)?.[1]??0),fail:Number(log.match(/^\s*(\d+) fail$/m)?.[1]??0),ms:performance.now()-started,log:logPath}
  results.push(result);console.log(JSON.stringify(result))
  await Bun.write('report/evidence/standalone-results.json',JSON.stringify({head:target.revision,method:'Markdown files extracted into isolated scratch folders, compared byte-for-byte with companion sources, then run without conformance preload or harness.',results},null,2)+'\n')
 }
}
await mkdir('report/evidence/standalone',{recursive:true})
const queue=[...issues];await Promise.all([0,1].map(async()=>{while(queue.length){const path=queue.shift();if(path)await verify(path)}}))
if(results.some(r=>r.timedOut||!r.fail))throw Error('An inline reproduction needs review')
console.log('All inline runtime desired-behavior assertions failed; review raw signatures before filing.')
