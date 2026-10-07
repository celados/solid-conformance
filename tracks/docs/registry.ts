export type DocCase = { id: string; file: string; statement: string; run: () => unknown | Promise<unknown> }
export type DocResult = { id: string; file: string; statement: string; error?: string }
export function equal(actual: unknown, expected: unknown) {
	if (JSON.stringify(actual) !== JSON.stringify(expected))
		throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
}
export function ok(value: unknown, message = 'Invariant failed') { if (!value) throw new Error(message) }
export function throws(fn: () => unknown, text?: string) {
	try { fn() } catch (error) { if (text) ok(String(error).includes(text), String(error)); return error }
	throw new Error('Expected an exception')
}
export async function runCases(cases: DocCase[]): Promise<DocResult[]> {
	const results: DocResult[] = []
	for (const c of cases) {
		let timer: ReturnType<typeof setTimeout> | undefined
		try { await Promise.race([c.run(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Statement did not settle within 2000ms')), 2000) })]); results.push({ id: c.id, file: c.file, statement: c.statement }) }
		catch (error) { results.push({ id: c.id, file: c.file, statement: c.statement, error: String(error) }) }
		finally { clearTimeout(timer) }
	}
	return results
}
