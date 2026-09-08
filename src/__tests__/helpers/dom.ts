/**
 * DOM test helpers for Vanilla Web Component testing.
 */

/** Creates a DOM element from an HTML string */
export function html(
	strings: TemplateStringsArray,
	...values: unknown[]
): HTMLElement {
	const raw = strings.reduce(
		(acc, str, i) => acc + str + (values[i] ?? ""),
		"",
	);
	const template = document.createElement("template");
	template.innerHTML = raw.trim();
	return template.content.firstChild as HTMLElement;
}

/** Mounts a component tag inside #app and returns the element */
export function mount<T extends HTMLElement>(tagName: string): T {
	let app = document.getElementById("app");
	if (!app) {
		app = document.createElement("div");
		app.id = "app";
		document.body.appendChild(app);
	}
	const el = document.createElement(tagName);
	app.appendChild(el);
	return el as T;
}

/** Creates a mock File with given name and type */
export function createMockFile(name: string, type: string, size = 1024): File {
	const blob = new Blob([new Uint8Array(size)], { type });
	return new File([blob], name, { type });
}

/** Creates a FileList from an array of Files */
export function createFileList(files: File[]): FileList {
	const dt = new DataTransfer();
	files.forEach((f) => dt.items.add(f));
	return dt.files;
}
