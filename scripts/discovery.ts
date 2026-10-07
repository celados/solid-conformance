import { build } from './build'
await build()
const { discovery, renderToStream, inRequest } =
	(await import('../.build/server.js')) as typeof import('../harness/server')
const kind = process.argv[2] ?? 'hole',
	source = process.argv[3] ?? 'iterable'
const fixture = discovery(kind, source)
const errors: string[] = []
const output = await inRequest(() =>
	Promise.resolve(
		renderToStream(fixture.App, {
			onError: (e: unknown) => errors.push(String(e)),
		}) as PromiseLike<string>,
	),
)
console.log(
	JSON.stringify({
		kind,
		source,
		calls: fixture.calls(),
		errors,
		rendered: /<p[^>]*>v<\/p>/.test(output),
	}),
)
if (errors.length || !/<p[^>]*>v<\/p>/.test(output) || fixture.calls() > 20)
	process.exit(1)
