export function normalizedDOM(element: HTMLElement) {
		const root = element.cloneNode(true) as HTMLElement
		root.querySelectorAll('script,template').forEach((el) => el.remove())
		root.querySelectorAll('*').forEach((el) => {
			for (const attr of [...el.attributes])
				if (attr.name === '_hk' || attr.name === 'data-hk')
					el.removeAttribute(attr.name)
			// Attribute insertion order differs between DOM setters and HTML parsing.
			// Preserve every value while comparing a stable representation.
			const attributes = [...el.attributes].sort((a, b) => a.name.localeCompare(b.name))
			for (const attr of attributes) el.removeAttributeNode(attr)
			for (const attr of attributes) el.setAttributeNode(attr)
		})
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)
		const comments: Node[] = []
		while (walker.nextNode()) comments.push(walker.currentNode)
		comments.forEach((n) => n.parentNode?.removeChild(n))
		return root.innerHTML
}
