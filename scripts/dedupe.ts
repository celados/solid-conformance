// Read-only issue searches; no upstream write capability is used.
const terms=process.argv.slice(2)
const queries=terms.flatMap(term=>['open','closed'].map(state=>({term,state})))
const results=await Promise.all(queries.map(async q=>{
	const child=Bun.spawn(['gh','search','issues',q.term,'--repo','solidjs/solid','--repo','solidjs/solid-router','--repo','solidjs/solid-start','--state',q.state,'--limit','100','--json','number,title,url,repository'],{stdout:'pipe',stderr:'inherit'})
	const output=await new Response(child.stdout).text()
	if(await child.exited)throw new Error(`Issue search failed: ${q.term}/${q.state}`)
	return {...q,results:JSON.parse(output)}
}))
await Bun.write('artifacts/dedupe.json',JSON.stringify({at:new Date().toISOString(),results},null,2))
console.log(JSON.stringify(results,null,2))

export {}
