import {resolve, dirname} from 'node:path'
type Draft = {type:string; status:string; filing?:string; head?:string; target?:string; repo?:string; title:string; findings:string[]; repro_commit:string}
const head = (await Bun.file('report/evidence/wave5-fix-provenance.json').json()).head
const paths = (await Array.fromAsync(new Bun.Glob('report/issues/*.md').scan('.'))).sort()
const seen = new Set<string>(), fileable: string[] = [], links = new Set<string>()
for (const path of paths) {
 const text = await Bun.file(path).text(), front = Bun.YAML.parse(text.split('---')[1]!) as Draft
 if(front.filing !== 'fileable') continue // Filed, withdrawn and held proposals are historical, not this batch.
 if(front.type !== 'Issue' || front.status !== 'draft' || front.head !== head) throw new Error('Draft metadata: '+path)
 if(!['solidjs/solid','solidjs/solid-router'].includes(front.repo ?? '') || front.target !== front.repo) throw new Error('Target repository: '+path)
 if(!/^\[2\.0 (?:rc\.15 \+ next|next, regressed after rc\.15)\]/.test(front.title)) throw new Error('Version title: '+path)
 if(!/^[a-f0-9]{40}$/.test(front.repro_commit)) throw new Error('Unpinned reproduction: '+path)
 const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
 if(body.trim().split('\n').length > 50) throw new Error('More than 50 visible lines: '+path)
 const headings = [...body.matchAll(/^### (.+)$/gm)].map(m=>m[1])
 if(JSON.stringify(headings) !== JSON.stringify(['Describe the bug','Your Example Website or App','Steps to Reproduce the Bug or Issue','Expected behavior','Platform','Additional context'])) throw new Error('Template headings: '+path)
 const snippet = body.match(/```(?:tsx?|ts)\n([\s\S]*?)\n```/)?.[1]
 if(!snippet || /as any|@ts-/.test(snippet)) throw new Error('Missing or bypassed source: '+path)
 for(const id of front.findings) {if(seen.has(id)) throw new Error('Duplicated finding: '+id);seen.add(id)}
 for(const match of text.matchAll(/https:\/\/github\.com\/celados\/solid-conformance\/(?:tree|blob)\/([a-f0-9]{40})\/([^\s)]+)/g)) {
  const address = match[1]+':'+match[2]!.replace(/\/$/, '')
  const child=Bun.spawn(['git','cat-file','-e',address],{stdout:'pipe',stderr:'pipe'})
  if(await child.exited) throw new Error('Missing local pinned object: '+address)
  links.add(address)
 }
 fileable.push(path)
}
for(const path of ['report/README.md','report/FILING.md','report/TRIAGE.md']) {
 const text=await Bun.file(path).text()
 for(const[,raw]of text.matchAll(/\]\(([^)]+)\)/g)) {
  if(raw!.startsWith('http')||raw!.startsWith('#'))continue
  const target=resolve(dirname(path),raw!.split('#')[0]!)
  if(!(await Bun.file(target).exists()))throw new Error('Broken local link: '+path+':'+raw)
 }
}
await Bun.write('report/evidence/wave5-report-validation.json',JSON.stringify({head,fileable,findings:[...seen],pinnedObjects:links.size,linkVerification:'local Git objects; remote links await orchestrator push',valid:true},null,2)+'\n')
console.log(JSON.stringify({fileable:fileable.length,findings:seen.size,pinnedObjects:links.size,valid:true}))
