import { renderToStream, renderToString, RequestContext, createRequestEvent } from '@solidjs/web'
import { AsyncLocalStorage } from 'node:async_hooks'
import { fixture, shapes, sources } from './cases'
const host = globalThis as any
const scope = (host[RequestContext] ??= new AsyncLocalStorage())
const only = process.env.ONLY
async function one(shape: any, kind: any, how: 'stream' | 'string') {
	const f = fixture(shape, kind)
	const errors: string[] = []
	const t = Date.now()
	const run = () => how === 'stream'
		? Promise.resolve(renderToStream(f.App, { manifest: {}, onError: (e: unknown) => { errors.push(String(e)) } }) as PromiseLike<string>)
		: Promise.resolve().then(() => renderToString(f.App, { onError: (e: unknown) => { errors.push(String(e)) } } as any) as any)
	let out = ''
	try { out = await Promise.race([
		scope.run(createRequestEvent(new Request('http://x.test/')), run),
		new Promise<string>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT 15s')), 15000)) ]) } catch (e) { errors.push(String(e)) }
	const ok = errors.length === 0 && /<p[^>]*>(v|Jon)<\/p>|Jon:v/.test(String(out))
	console.log(JSON.stringify({ shape, kind, how, result: ok ? 'CONVERGED' : 'FAILED', calls: f.calls(), ms: Date.now() - t,
		error: errors[0]?.slice(0, 110), html: ok ? undefined : String(out).slice(0, 80) }))
}
export async function runAll() {
	// ONLY=<shape>/<kind>/<stream|string> runs one cell (the matrix script uses one process per cell)
	for (const shape of shapes) for (const kind of sources) for (const how of ['stream'] as const) {
		if (only && only !== `${shape}/${kind}/${how}`) continue
		await one(shape, kind, how)
	}
}
