import { mkdir, realpath, rm, symlink } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = process.argv[2]
if (!source) throw new Error('Pass the path to the built Solid HEAD checkout.')
const root = await realpath(source)
for (const [name, folder] of [
 ['solid-js', 'solid'], ['@solidjs/signals', 'signals'],
 ['@solidjs/web', 'web'], ['@solidjs/compiler', 'compiler'],
 ['@solidjs/diagnostics', 'diagnostics'],
]) {
 const packagePath = resolve(root, 'packages', folder!)
 if (!await Bun.file(resolve(packagePath, 'package.json')).exists())
  throw new Error('Missing built package: ' + packagePath)
 const destination = resolve('node_modules', name!)
 await rm(destination, { recursive: true, force: true })
 await mkdir(resolve(destination, '..'), { recursive: true })
 await symlink(packagePath, destination, 'dir')
}
console.log('Linked the five matching HEAD packages from ' + root)
