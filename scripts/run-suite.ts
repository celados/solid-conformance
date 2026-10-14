import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'

export async function runSuite(){
 const mode=process.env.BUILD_MODE??'development',directory=resolve('artifacts','suite-'+mode)
 await mkdir(directory,{recursive:true})
 const files=(await Array.fromAsync(new Bun.Glob('tracks/**/*.test.ts').scan('.'))).sort()
 const receipt='artifacts/suite-'+mode+'.json'
 type Result={file:string;mode:string;exitCode:number|null;timedOut:boolean;ms:number;pass:number;fail:number;skip:number;log:string;pid?:number}
 const results:Result[]=process.env.SUITE_RESUME==='1'&&await Bun.file(receipt).exists()?(await Bun.file(receipt).json()).results:[]
 for(const file of files){
  if(results.some(result=>result.file===file))continue
  const started=performance.now(),output:string[]=[]
  // Each artifact may install process-lifetime SSR plugins and observe seams.
  // Keep deliberate cross-bundle tests together, but give each file a fresh host.
  const child=spawn(process.execPath,['test','./'+file],{cwd:process.cwd(),env:process.env,detached:true,stdio:['ignore','pipe','pipe']})
  console.log(JSON.stringify({started:file,pid:child.pid,mode}))
  child.stdout.on('data',chunk=>output.push(String(chunk)));child.stderr.on('data',chunk=>output.push(String(chunk)))
  let timedOut=false
  const budget=file==='tracks/properties/properties.test.ts'?Math.max(600000,Number(process.env.CASES??100)*6000):600000
  const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid!,'SIGKILL')}catch{child.kill('SIGKILL')}},Number(process.env.SUITE_FILE_BUDGET_MS??budget))
  const exitCode=await new Promise<number|null>((resolve,reject)=>{child.once('error',reject);child.once('close',code=>resolve(code))}).finally(()=>clearTimeout(timer))
  const text=output.join(''),slug=file.replaceAll('/','-'),log=directory+'/'+slug+'.log'
  await Bun.write(log,text)
  const counts={pass:Number(text.match(/^\s*(\d+) pass$/m)?.[1]??0),fail:Number(text.match(/^\s*(\d+) fail$/m)?.[1]??0),skip:Number(text.match(/^\s*(\d+) skip$/m)?.[1]??0)}
  const result={file,mode,pid:child.pid,exitCode,timedOut,ms:performance.now()-started,...counts,log};results.push(result)
  console.log(JSON.stringify(result))
  await Bun.write('artifacts/suite-'+mode+'.json',JSON.stringify({mode,files:files.length,results},null,2)+'\n')
 }
 return results
}
