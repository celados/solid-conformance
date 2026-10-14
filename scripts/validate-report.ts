import { resolve, dirname } from 'node:path'

type Draft = {
  type: string; status: string; filing?: string; head?: string; target?: string
  repo?: string; title: string; findings: string[]; repro_commit: string
  superseded_by?: string
}
const head = (await Bun.file('report/evidence/wave5-fix-provenance.json').json()).head
const order = ['29', '28', '20', '21', '30']
const paths = (await Array.fromAsync(new Bun.Glob('report/issues/*.md').scan('.'))).sort()
const seen = new Set<string>(), fileable: string[] = [], links = new Set<string>()
const visibleLines: Record<string, number> = {}

async function pinnedText(commit: string, path: string) {
  const child = Bun.spawn(['git', 'show', commit + ':' + path], {stdout: 'pipe', stderr: 'pipe'})
  const [stdout, stderr] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
  if (await child.exited) throw new Error('Missing pinned file: ' + path + '\n' + stderr)
  return stdout
}

for (const path of paths) {
  const text = await Bun.file(path).text()
  const front = Bun.YAML.parse(text.split('---')[1]!) as Draft
  const number = path.split('/').at(-1)!.slice(0, 2)
  if (['16', '17', '18', '19', '26'].includes(number)) {
    if (front.status !== 'superseded' || front.filing !== 'superseded' || front.superseded_by !== '30') {
      throw new Error('Missing supersession: ' + path)
    }
  }
  if (front.filing !== 'fileable') continue
  if (!order.includes(number) || front.type !== 'Issue' || front.status !== 'draft' || front.head !== head) {
    throw new Error('Draft metadata: ' + path)
  }
  if (front.repo !== 'solidjs/solid' || front.target !== front.repo) throw new Error('Target repository: ' + path)
  if (!front.title.startsWith('[2.0 rc.15 + next]')) throw new Error('Version title: ' + path)
  if (!/^[a-f0-9]{40}$/.test(front.repro_commit)) throw new Error('Unpinned reproduction: ' + path)
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '')
  visibleLines[number] = body.trim().split('\n').length
  if (visibleLines[number]! > 50) throw new Error('More than 50 visible lines: ' + path)
  const headings = [...body.matchAll(/^### (.+)$/gm)].map(match => match[1])
  if (JSON.stringify(headings) !== JSON.stringify(['Describe the bug', 'Your Example Website or App', 'Steps to Reproduce the Bug or Issue', 'Expected behavior', 'Platform', 'Additional context'])) {
    throw new Error('Template headings: ' + path)
  }
  if (!/```tsx?\n/.test(body) || /as any|@ts-|TARGET=|\.upstream\/|finding ids|excluded from this draft|type-bypass arm|No upstream writes were made|restoring the published graph|found by generated invariants/i.test(body)) {
    throw new Error('Source or maintainer wording: ' + path)
  }
  for (const id of front.findings) {
    if (seen.has(id)) throw new Error('Duplicated finding: ' + id)
    seen.add(id)
  }
  const match = body.match(/https:\/\/github\.com\/celados\/solid-conformance\/tree\/([a-f0-9]{40})\/(report\/repros\/[^\s)]+)/)
  if (!match || match[1] !== front.repro_commit) throw new Error('Missing standalone reproduction link: ' + path)
  const directory = match[2]!
  if (!body.includes('cd ' + directory) || !body.includes('\nbun install\nbun run repro\n')) throw new Error('Maintainer commands: ' + path)
  const manifest = JSON.parse(await pinnedText(front.repro_commit, directory + '/package.json'))
  for (const [name, version] of Object.entries(manifest.dependencies)) {
    if ((name === 'solid-js' || name.startsWith('@solidjs/')) && name !== '@solidjs/router' && version !== '2.0.0-rc.15') {
      throw new Error('Unpinned published dependency: ' + directory + ': ' + name)
    }
  }
  for (const file of ['README.md', 'bun.lock', 'run.ts', 'use-next.ts', 'repro.test.ts', 'bunfig.toml']) {
    const source = await pinnedText(front.repro_commit, directory + '/' + file)
    if (file.endsWith('.ts') && /(?:harness\/|\.\.\/\.\.\/|TARGET=|\.upstream\/|as any|@ts-)/.test(source)) throw new Error('Non-standalone utility: ' + directory + '/' + file)
  }
  links.add(front.repro_commit + ':' + directory)
  fileable.push(path)
}
if (fileable.length !== 5 || seen.size !== 9) throw new Error('Final batch coverage')
fileable.sort((a, b) => order.indexOf(a.split('/').at(-1)!.slice(0, 2)) - order.indexOf(b.split('/').at(-1)!.slice(0, 2)))

for (const path of ['report/README.md', 'report/FILING.md', 'report/TRIAGE.md']) {
  const text = await Bun.file(path).text()
  for (const [, raw] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (raw!.startsWith('http') || raw!.startsWith('#')) continue
    const target = resolve(dirname(path), raw!.split('#')[0]!)
    if (target === resolve('report/evidence/wave5-filing-validation.json')) continue // Written after validation below.
    if (!(await Bun.file(target).exists())) throw new Error('Broken local link: ' + path + ':' + raw)
  }
}
await Bun.write('report/evidence/wave5-filing-validation.json', JSON.stringify({head, fileable, findings: [...seen], visibleLines, pinnedObjects: links.size, standaloneChecks: true, linkVerification: 'local pinned Git files; remote links await orchestrator push', valid: true}, null, 2) + '\n')
console.log(JSON.stringify({fileable: fileable.length, findings: seen.size, visibleLines, pinnedObjects: links.size, valid: true}))
