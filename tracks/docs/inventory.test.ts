import { test, expect } from 'bun:test'
import inventory from './inventory.json'
import { join } from 'node:path'

test('RFC inventory: every entry has a stable source locator, explicit classification, and honest proof state',async()=>{
 const ids=new Set<string>()
 const source=join('.upstream',inventory.commit,'documentation/solid-2.0')
 for(const entry of inventory.statements){
  expect(ids.has(entry.id)).toBe(false);ids.add(entry.id)
  const text=await Bun.file(join(source,entry.file)).text()
  const normalized=text.split('\n').slice(entry.line-1,entry.end_line).join(' ').replace(/\s+/g,' ')
  expect(normalized.includes(entry.statement.replace(/\s+/g,' '))).toBe(true)
  if(entry.status==='covered'){
   expect(entry.coverage.length).toBeGreaterThan(0)
   for(const proof of entry.coverage)for(const [path]of proof.matchAll(/(?:tracks|findings|harness|scripts)\/[\w./-]+\.(?:tsx|ts)\b/g))expect(await Bun.file(path).exists()).toBe(true)
  }
  if(entry.status==='untestable'||entry.status==='not-behavioral')expect('reason' in entry).toBe(true)
 }
 expect(ids.size).toBe(inventory.statements.length)
 const count=(status:string)=>inventory.statements.filter(e=>e.status===status).length
 expect(inventory.summary.raw).toBe(ids.size)
 expect(inventory.summary.covered).toBe(count('covered'))
 expect(inventory.summary.uncovered).toBe(count('uncovered'))
 expect(inventory.summary.uncovered).toBe(0)
 expect(inventory.summary.untestable).toBe(count('untestable'))
 expect(inventory.summary.nonBehavioral).toBe(count('not-behavioral'))
 expect(inventory.summary.behavioral).toBe(count('covered')+count('uncovered')+count('untestable'))
})

test('RFC fenced recipes: every original block has one complete source review, separate from assertion coverage',async()=>{
 const blocks=await Bun.file('tracks/docs/fenced-examples.json').json()
 const reviews=(await Promise.all(['core-fenced-examples-review.json','frames-fenced-examples-review.json','router-diagnostic-fenced-examples-review.json'].map(async name=>(await Bun.file('tracks/docs/'+name).json()).blocks))).flat()
 expect(reviews.length).toBe(blocks.length)
 const ids=new Set<string>()
 for(const block of blocks){const matches=reviews.filter(r=>r.id===block.id);expect(matches).toHaveLength(1);expect(ids.has(block.id)).toBe(false);ids.add(block.id);expect(matches[0].line).toBe(block.line);expect(matches[0].end_line).toBe(block.end_line);expect(matches[0].review).toBe('reviewed');expect(matches[0].reason.length).toBeGreaterThan(0)}
})
