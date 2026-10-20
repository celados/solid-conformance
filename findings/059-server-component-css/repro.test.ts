import { expect, test } from 'bun:test'
import { chromium, type Browser } from 'playwright-core'
import { cp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const directory = import.meta.dirname
const repository = resolve(directory, '../..')
const head = '2172a37687e92dd91758476423f08cb4a12bcb0c'
const pluginHead = 'ec6b58d0c17290d6f474a9ed93bfa03d1dc9b8a0'
const packageNames = {
	solid: 'solid-js', signals: '@solidjs/signals', web: '@solidjs/web',
	compiler: '@solidjs/compiler', 'babel-plugin': '@solidjs/babel-plugin',
	diagnostics: '@solidjs/diagnostics',
}

async function run(command: string[], cwd: string) {
	const process = Bun.spawn(command, { cwd, stdout: 'pipe', stderr: 'pipe' })
	const [exitCode, stdout, stderr] = await Promise.all([
		process.exited, new Response(process.stdout).text(), new Response(process.stderr).text(),
	])
	if (exitCode) throw new Error(`${command.join(' ')} failed (${exitCode})\n${stdout}\n${stderr}`)
	return { command, exitCode, stdout, stderr }
}

async function prepare(version: 'rc15' | 'head', work: string) {
	await mkdir(work, { recursive: true })
	await cp(resolve(directory, 'fixture'), work, { recursive: true })
	const dependencies = Object.fromEntries(
		Object.values(packageNames).map(name => [name, '2.0.0-rc.15']),
	)
	Object.assign(dependencies, { '@solidjs/vite-plugin': '3.0.0-next.50', vite: '8.3.4' })
	const overrides = { ...dependencies }
	if (version === 'head') {
		const snapshot = resolve(directory, '.scratch/upstream', head, 'packages')
		for (const [folder, name] of Object.entries(packageNames)) {
			const destination = resolve(snapshot, folder)
			if (!(await Bun.file(resolve(destination, 'package.json')).exists())) {
				const source = resolve(repository, '.upstream', head, 'packages', folder)
				if (!(await Bun.file(resolve(source, 'package.json')).exists())) {
					throw new Error(`Build upstream ${head} with the repository harness first; missing ${source}`)
				}
				await cp(source, destination, { recursive: true, filter: source => !source.split('/').includes('node_modules') })
			}
		}
	}
	await writeFile(resolve(work, 'package.json'), JSON.stringify({
		name: `finding-059-${version}`, private: true, type: 'module', dependencies, overrides,
	}, null, 2))
	await run(['bun', 'install'], work)
	if (version === 'head') {
		// Resolve one registry dependency graph first, then replace each package
		// at its physical location so transitive imports share the same build.
		// Removing that directory first also avoids writing through cache hardlinks.
		for (const [folder, name] of Object.entries(packageNames)) {
			const destination = await realpath(resolve(work, 'node_modules', name))
			if (!destination.startsWith(resolve(work, 'node_modules') + '/')) throw new Error(`Refusing to replace a package outside this case: ${destination}`)
			await rm(destination, { recursive: true, force: true })
			await cp(resolve(directory, '.scratch/upstream', head, 'packages', folder), destination, { recursive: true })
		}
	}
}

async function start(work: string) {
	const portReservation = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response() })
	const port = portReservation.port!
	portReservation.stop(true)
	const process = Bun.spawn(['bun', 'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
		cwd: work, stdout: 'pipe', stderr: 'pipe',
	})
	const stdout = new Response(process.stdout).text()
	const stderr = new Response(process.stderr).text()
	const url = `http://127.0.0.1:${port}`
	for (let attempt = 0; attempt < 200; attempt++) {
		try { if ((await fetch(`${url}/a`)).ok) return { process, stdout, stderr, url } } catch {}
		if (process.exitCode !== null) throw new Error(`Preview exited: ${await stdout}\n${await stderr}`)
		await Bun.sleep(50)
	}
	process.kill('SIGTERM')
	await process.exited
	throw new Error(`Preview did not start: ${await stdout}\n${await stderr}`)
}

async function inspect(work: string) {
	const server = await start(work)
	let browser: Browser | undefined
	const observations: Record<string, unknown> = { serverPid: server.process.pid }
	try {
		browser = await chromium.launch({ channel: 'chrome', headless: true })
		observations.browser = browser.version()
		const html = await (await fetch(`${server.url}/b`)).text()
		observations.ssrContainsNotes = html.includes('id="notes"')
		observations.ssrStylesheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(match => match[0])
		for (const navigation of [false, true]) {
			const context = await browser.newContext()
			const page = await context.newPage()
			const errors: string[] = []
			const serverCalls: string[] = []
			page.on('pageerror', error => errors.push(error.message))
			page.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()) })
			page.on('request', request => { if (request.url().includes('/_server/')) serverCalls.push(request.url()) })
			try {
				await page.goto(server.url + (navigation ? '/a' : '/b'))
				let frame: { status: number; contentType: string; body: string } | undefined
				if (navigation) {
					const response = page.waitForResponse(response => response.url().includes('/_server/'))
					await page.locator('#to-b').click()
					const result = await response
					frame = { status: result.status(), contentType: result.headers()['content-type'] ?? '', body: await result.text() }
				}
				await page.locator('#notes').waitFor()
				await page.waitForTimeout(100)
				observations[navigation ? 'navigation' : 'document'] = {
					color: await page.locator('#notes').evaluate(element => getComputedStyle(element).color),
					count: await page.locator('#notes').count(), errors, serverCalls, frame,
				}
			} catch (error) {
				observations[navigation ? 'navigation' : 'document'] = {
					failure: String(error), errors, serverCalls,
					body: await page.locator('body').innerText(),
				}
			} finally { await context.close() }
		}
	} finally {
		await browser?.close()
		server.process.kill('SIGTERM')
		await server.process.exited
		observations.serverStdout = await server.stdout
		observations.serverStderr = await server.stderr
		observations.cleaned = { browserClosed: true, serverExited: server.process.exitCode !== null }
	}
	return observations as typeof observations & {
		document: { color: string; count: number; errors: string[]; serverCalls: string[] },
		navigation: { color: string; count: number; errors: string[]; frame: { status: number; contentType: string } },
	}
}

for (const version of ['rc15', 'head'] as const) {
	test(`server-only CSS reaches SSR and frame navigation (${version})`, async () => {
		const work = resolve(directory, '.scratch/runs', `${version}-${process.pid}`)
		const evidence: Record<string, unknown> = {
			finding: '059', version, solidSha: version === 'head' ? head : '4937f0a2bfddd45a65738c189075aff577530073',
			pluginVersion: '3.0.0-next.50', pluginHead, vite: '8.3.4', bun: Bun.version, recordedAt: new Date().toISOString(),
		}
		try {
			await prepare(version, work)
			evidence.packages = await Promise.all(Object.keys({ ...Object.fromEntries(Object.values(packageNames).map(name => [name, true])), '@solidjs/vite-plugin': true, vite: true }).map(async name => {
				const path = resolve(work, 'node_modules', name, 'package.json')
				const metadata = JSON.parse(await readFile(path, 'utf8'))
				return { name, version: metadata.version, realpath: await realpath(path) }
			}))
			evidence.build = await run(['bun', 'node_modules/vite/bin/vite.js', 'build'], work)
			const actual = await inspect(work)
			evidence.actual = actual
			// A client-owned import is the positive control; it must style both paths.
			const app = resolve(work, 'src/App.tsx')
			await writeFile(app, `import './notes.css'\n${await readFile(app, 'utf8')}`)
			evidence.controlBuild = await run(['bun', 'node_modules/vite/bin/vite.js', 'build'], work)
			const control = await inspect(work)
			evidence.clientImportControl = control
			for (const result of [actual, control]) {
				expect(result.ssrContainsNotes).toBe(true)
				expect(result.serverStderr).toBe('')
				expect(result.document.errors).toEqual([])
				expect(result.navigation.errors).toEqual([])
				expect(result.document.count).toBe(1)
				expect(result.navigation.count).toBe(1)
				expect(result.document.serverCalls).toEqual([])
				expect(result.navigation.frame.status).toBe(200)
				expect(result.navigation.frame.contentType).toContain('application/x-frame-stream')
			}
			expect([control.document.color, control.navigation.color]).toEqual(['rgb(255, 0, 0)', 'rgb(255, 0, 0)'])
			// Desired behavior stays red until #456 is fixed; never invert it to the bug.
			expect([actual.document.color, actual.navigation.color]).toEqual(['rgb(255, 0, 0)', 'rgb(255, 0, 0)'])
		} catch (error) {
			evidence.failure = String(error)
			throw error
		} finally {
			await rm(work, { recursive: true, force: true })
			evidence.runDirectoryRemoved = true
			await mkdir(resolve(repository, 'report/evidence'), { recursive: true })
			await writeFile(resolve(repository, 'report/evidence', `field-css-${version}.json`), JSON.stringify(evidence, null, 2) + '\n')
		}
	}, 180000)
}
