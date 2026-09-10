/**
 * Minimal HTML escaping for values interpolated into innerHTML templates.
 * Attribute values set via setAttribute/textContent do not need this, but any
 * string placed inside an HTML string must pass through here first.
 */
export const escapeHtml = (value: string): string =>
	value.replace(/[&<>"']/g, (char) => {
		const entities: Record<string, string> = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		};
		return entities[char];
	});
