export type Kind =
	| 'text'
	| 'promise'
	| 'iterable'
	| 'store'
	| 'optimistic'
	| 'optimistic-store'
	| 'action'
	| 'effect'
	| 'lazy'
	| 'show'
	| 'for'
	| 'keyed-for'
	| 'switch'
	| 'loading'
	| 'errored'
	| 'group'
export type Tree = { kind: Kind; value: number; children: Tree[] }
export type Spec = { tree: Tree; order: number[]; scenario?: string }
export function leaf(kind: Kind = 'text', value = 1): Tree {
	return { kind, value, children: [] }
}
export function wrap(kind: Kind, tree: Tree): Tree {
	return { kind, value: 1, children: [tree] }
}
export function sourceIds(tree: Tree): number[] {
	const ids: number[] = []
	let id = 0
	function visit(node: Tree) {
		const current = id++
		if (['promise', 'iterable', 'lazy'].includes(node.kind)) ids.push(current)
		node.children.forEach(visit)
	}
	visit(tree)
	return ids
}
