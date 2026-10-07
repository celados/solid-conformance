import {resolve,dirname} from 'node:path'
const target=await Bun.file('report/evidence/target.json').json()
const previous=await Bun.file('evidence/wave3-findings-matrix.json').json()
const active=new Set<string>(previous.findings.filter((f:any)=>f.status==='confirmed').map((f:any)=>f.id))
const seen=new Set<string>(),issues=(await Array.fromAsync(new Bun.Glob('report/issues/*.md').scan('.'))).sort()
for(const path of issues){const text=await Bun.file(path).text(),front=Bun.YAML.parse(text.split('---')[1]!)as any;if(front.type!=='Issue'||front.status!=='draft')throw Error('Wrong draft metadata '+path);if((front.head??front.target)!==target.revision)throw Error('Stale target '+path);for(const id of front.findings){if(!active.has(id)||seen.has(id))throw Error('Duplicate or inactive finding '+id);seen.add(id)}
 if(front.tier==='A'){const name=path.split('/').at(-1)!.replace('.md','');for(const [,file,code]of text.matchAll(/### `([^`]+)`\s*\n\s*```(?:ts|tsx)\n([\s\S]*?)\n```/g)){if((await Bun.file('report/repros/'+name+'/'+file).text()).trim()!==code!.trim())throw Error('Source mismatch '+path+':'+file)}}
 for(const [,raw]of text.matchAll(/\]\(([^)]+)\)/g)){if(raw!.startsWith('http')||raw!.startsWith('#'))continue;const file=raw!.split('#')[0]!.split(':')[0]!;if(!await Bun.file(resolve(dirname(path),file)).exists())throw Error('Broken local link '+path+':'+raw)}
}
if(seen.size!==active.size)throw Error('Missing confirmed finding')
for(const path of ['report/README.md','report/TRIAGE.md']){const text=await Bun.file(path).text();for(const [,raw]of text.matchAll(/\]\(([^)]+)\)/g)){if(raw!.startsWith('http')||raw!.startsWith('#')||raw!.endsWith('/'))continue;if(!await Bun.file(resolve(dirname(path),raw!)).exists())throw Error('Broken index link '+path+':'+raw)}}
console.log(JSON.stringify({head:target.revision,proposals:issues.length,coveredFindings:seen.size,duplicateCoverage:0,valid:true}))
