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
 expect(inventory.summary.untestable).toBe(count('untestable'))
 expect(inventory.summary.nonBehavioral).toBe(count('not-behavioral'))
 expect(inventory.summary.behavioral).toBe(count('covered')+count('uncovered')+count('untestable'))
})
