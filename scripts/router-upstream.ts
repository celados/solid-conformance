import {mkdir, rm, symlink, realpath} from 'node:fs/promises'
import {resolve} from 'node:path'
async function run(command: string[], cwd = process.cwd()) {
 const child = Bun.spawn(command, {cwd, stdout: 'inherit', stderr: 'inherit'})
 console.log(`Started ${child.pid}: ${command.join(' ')}`)
 if (await child.exited) throw new Error(command.join(' '))
}
const ref = process.env.ROUTER_UPSTREAM_REF ?? 'next'
await mkdir('.upstream', {recursive: true})
if (process.argv.includes('--restore')) {
 await rm('node_modules/@solidjs/router', {recursive: true, force: true})
 await run(['bun', 'install', '--frozen-lockfile'])
} else {
 let built: {ref: string; revision: string; directory: string}
 if (process.argv.includes('--link-built')) built = await Bun.file('.upstream/router-built.json').json()
 else {
  const response = await fetch(`https://api.github.com/repos/solidjs/solid-router/commits/${encodeURIComponent(ref)}`)
  if (!response.ok) throw new Error(`Router revision ${response.status}`)
  const revision = (await response.json() as {sha: string}).sha
  const directory = resolve('.scratch/router', revision)
  await mkdir(directory, {recursive: true})
  const tar = resolve('.scratch/router', revision + '.tar.gz')
  await run(['curl', '-fsSL', `https://codeload.github.com/solidjs/solid-router/tar.gz/${revision}`, '-o', tar])
  await run(['tar', '-xzf', tar, '-C', directory, '--strip-components=1'])
  const pkg = await Bun.file(directory + '/package.json').json()
  pkg.devDependencies = Object.fromEntries(Object.entries(pkg.devDependencies).filter(([name]) => ['@babel/core', '@babel/preset-typescript', '@rollup/plugin-babel', '@rollup/plugin-node-resolve', 'babel-preset-solid', 'rollup', 'typescript', '@types/node', 'solid-js', '@solidjs/web'].includes(name)))
  delete pkg.scripts.prepublishOnly
  delete pkg.peerDependencies
  await Bun.write(directory + '/package.json', JSON.stringify(pkg, null, 2))
  await run(['bun', 'install', '--ignore-scripts'], directory)
  await run(['bun', 'x', '--no-install', 'tsc'], directory)
  await run(['bun', 'x', '--no-install', 'rollup', '-c'], directory)
  await run(['bun', 'scripts/check-fs-gate.mjs'], directory)
  built = {ref, revision, directory: await realpath(directory)}
  await Bun.write('.upstream/router-built.json', JSON.stringify(built, null, 2))
 }
 if (!process.argv.includes('--build-only')) {
  await rm('node_modules/@solidjs/router', {recursive: true, force: true})
  await symlink(built.directory, resolve('node_modules/@solidjs/router'), 'dir')
 }
 console.log(JSON.stringify(built))
}
