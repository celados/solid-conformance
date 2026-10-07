import { mkdir, rm, symlink } from 'node:fs/promises'
import { resolve } from 'node:path'
const root = process.cwd()
async function run(cmd: string[], cwd = root) {
	console.log(`> ${cmd.join(' ')}`)
	const child = Bun.spawn(cmd, { cwd, stdout: 'inherit', stderr: 'inherit' })
	if ((await child.exited) !== 0) throw new Error(`Failed: ${cmd.join(' ')}`)
}
async function link(directory: string, revision: string, ref: string) {
	for (const [name, folder] of [
		['solid-js', 'solid'],
		['@solidjs/signals', 'signals'],
		['@solidjs/web', 'web'],
		['@solidjs/compiler', 'compiler'],
		['@solidjs/babel-plugin', 'babel-plugin'],
		['@solidjs/diagnostics', 'diagnostics'],
		['@solidjs/h', 'h'],
		['@solidjs/html', 'html'],
		['@solidjs/universal', 'universal'],
	]) {
		const destination = resolve('node_modules', name!)
		await rm(destination, { recursive: true, force: true })
		await mkdir(resolve(destination, '..'), { recursive: true })
		await symlink(`${directory}/packages/${folder}`, destination, 'dir')
	}
	await Bun.write(
		'.upstream/active.json',
		JSON.stringify({ ref, revision, directory }, null, 2),
	)
	console.log(
		`Linked upstream ${revision}. Restore: bun run upstream --restore`,
	)
}
if (process.argv.includes('--link-built')) {
	const built = await Bun.file('.upstream/built.json').json()
	await link(built.directory, built.revision, built.ref)
} else if (process.argv.includes('--restore')) {
	for (const name of [
		'solid-js',
		'@solidjs/signals',
		'@solidjs/web',
		'@solidjs/compiler',
		'@solidjs/babel-plugin',
		'@solidjs/diagnostics',
		'@solidjs/h',
		'@solidjs/html',
		'@solidjs/universal',
	])
		await rm(resolve('node_modules', name), { recursive: true, force: true })
	await run(['bun', 'install', '--frozen-lockfile'])
	await rm('.upstream/active.json', { force: true })
} else {
	const ref = process.env.UPSTREAM_REF ?? 'next'
	const revisionResponse = await fetch(
		`https://api.github.com/repos/solidjs/solid/commits/${encodeURIComponent(ref)}`,
	)
	if (!revisionResponse.ok)
		throw new Error(`GitHub revision: ${revisionResponse.status}`)
	const revision = ((await revisionResponse.json()) as { sha: string }).sha
	const directory = resolve('.upstream', revision)
	await mkdir(directory, { recursive: true })
	const tar = resolve('.upstream', `${revision}.tar.gz`)
	await run([
		'curl',
		'-fsSL',
		`https://codeload.github.com/solidjs/solid/tar.gz/${revision}`,
		'-o',
		tar,
	])
	await run(['tar', '-xzf', tar, '-C', directory, '--strip-components=1'])
	const pkg = await Bun.file(`${directory}/package.json`).json()
	pkg.workspaces = ['packages/*']
	pkg.overrides = {
		'solid-js': 'workspace:*',
		'@solidjs/signals': 'workspace:*',
		'@solidjs/web': 'workspace:*',
		'@solidjs/babel-plugin': 'workspace:*',
		'@solidjs/compiler': 'workspace:*',
	}
	delete pkg.scripts.preinstall
	delete pkg.scripts.postinstall
	await Bun.write(`${directory}/package.json`, JSON.stringify(pkg, null, 2))
	await run(['bun', 'install', '--ignore-scripts'], directory)
	// Run upstream build tools through Bun, without invoking pnpm/npm scripts.
	for (const name of ['signals', 'solid', 'web']) {
		const cwd = `${directory}/packages/${name}`
		if (name === 'web')
			await run(
				[
					'bun',
					'scripts/jsx-sync.mjs',
					'--compile',
					'--element',
					'SolidElement | Node | ArrayElement',
					'--import',
					'import type { Element as SolidElement } from "solid-js";',
				],
				cwd,
			)
		await run(['bun', 'x', '--no-install', 'rollup', '-c'], cwd)
		if (name === 'signals')
			for (const variant of ['prod', 'observe']) {
				await run(['bun', 'scripts/mangle-props.mjs', `dist/${variant}`], cwd)
				await run(['bun', 'scripts/check-pure.mjs', `dist/${variant}`], cwd)
			}
	}
	for (const name of ['signals', 'solid', 'web']) {
		const cwd = `${directory}/packages/${name}`
		await run(
			['bun', 'x', '--no-install', 'tsc', '-p', 'tsconfig.build.json'],
			cwd,
		)
		if (name === 'web') {
			await run(['bun', 'scripts/copy-types.mjs'], cwd)
			await run(['bun', 'x', '--no-install', 'tsc', '-p', 'performance-tracks/tsconfig.build.json'], cwd)
		}
	}
	const h = `${directory}/packages/h`
	for (const destination of ['src', 'types']) {
		await mkdir(`${h}/jsx-runtime/${destination}`, { recursive: true })
		await Bun.write(`${h}/jsx-runtime/${destination}/jsx-properties.d.ts`, Bun.file(`${directory}/packages/web/jsx/jsx-properties.d.ts`))
		await run(['bun', '../web/scripts/jsx-sync.mjs', '--input', '../web/jsx/jsx-h.d.ts', '--output', `./jsx-runtime/${destination}/jsx.d.ts`, '--element', 'SolidElement | Node | FunctionElement | ArrayElement', '--import', 'import type { Element as SolidElement } from "solid-js";'], h)
	}
	await run(['bun', 'x', '--no-install', 'tsc', '-p', 'tsconfig.json'], h)
	await run(['bun', 'x', '--no-install', 'tsc', '-p', 'jsx-runtime/tsconfig.json'], h)
	await run(['bun', 'x', '--no-install', 'rollup', '-c'], h)
	for (const name of ['html', 'universal']) {
		const cwd = `${directory}/packages/${name}`
		await run(['bun', 'x', '--no-install', 'tsc', '-p', 'tsconfig.json'], cwd)
		await run(['bun', 'x', '--no-install', 'rollup', '-c'], cwd)
	}
	await run(
		['bun', 'x', '--no-install', 'rollup', '-c', '--bundleConfigAsCjs'],
		`${directory}/packages/babel-plugin`,
	)
	await run(
		[
			'bun',
			'x',
			'--no-install',
			'napi',
			'build',
			'--release',
			'--strip',
			'--manifest-path',
			'./Cargo.toml',
		],
		`${directory}/packages/compiler`,
	)
	await run(
		['bun', 'x', '--no-install', 'tsc', '-p', 'tsconfig.build.json'],
		`${directory}/packages/diagnostics`,
	)
	await Bun.write(
		'.upstream/built.json',
		JSON.stringify({ ref, revision, directory }, null, 2),
	)
	if (!process.argv.includes('--build-only'))
		await link(directory, revision, ref)
}
