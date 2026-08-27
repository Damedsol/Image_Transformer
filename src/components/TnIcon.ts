/**
 * <tn-icon> — Iconoir-based icon Web Component (SNA-36)
 *
 * Imports only needed icons (tree-shaking) as raw SVG from assets/icons/.
 * Shadows DOM to protect SVG integrity.
 * Features: square stroke-linecap, miter stroke-linejoin, aria-hidden by default.
 *
 * @license MIT — Iconoir (https://iconoir.com)
 */
import upload from "../../assets/icons/upload.svg?raw";
import trash from "../../assets/icons/trash.svg?raw";
import download from "../../assets/icons/download.svg?raw";
import mediaImage from "../../assets/icons/media-image.svg?raw";
import checkCircle from "../../assets/icons/check-circle.svg?raw";
import warningCircle from "../../assets/icons/warning-circle.svg?raw";
import settings from "../../assets/icons/settings.svg?raw";
import github from "../../assets/icons/github.svg?raw";
import linkedin from "../../assets/icons/linkedin.svg?raw";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Strips the <svg> wrapper and per-node presentation attributes from a
 * vendored Iconoir SVG, keeping only the geometry (<path>/<circle>...).
 * Rendered attributes are applied uniformly by TnIcon.render().
 */
function normalizeSvg(raw: string): string {
	return raw
		.replace(/<svg[^>]*>/, "")
		.replace(/<\/svg>/, "")
		.replace(
			/\s(?:stroke|stroke-width|stroke-linecap|stroke-linejoin|fill|width|height)="[^"]*"/g,
			"",
		);
}

const IconoirRegistry: Record<string, string> = {
	upload: normalizeSvg(upload),
	check: normalizeSvg(checkCircle),
	alert: normalizeSvg(warningCircle),
	download: normalizeSvg(download),
	image: normalizeSvg(mediaImage),
	settings: normalizeSvg(settings),
	trash: normalizeSvg(trash),
	github: normalizeSvg(github),
	linkedin: normalizeSvg(linkedin),
};

export class TnIcon extends HTMLElement {
	private shadow: ShadowRoot;

	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
	}

	static get observedAttributes(): string[] {
		return ["name", "size", "color"];
	}

	connectedCallback(): void {
		this.render();
	}

	attributeChangedCallback(): void {
		this.render();
	}

	private render(): void {
		const name = this.getAttribute("name");
		if (!name) return; // No-op when name not set

		const size = this.getAttribute("size") || "24";
		const color = this.getAttribute("color") || "currentColor";

		const geometry = IconoirRegistry[name];
		if (!geometry) {
			console.warn(`[tn-icon] Unknown icon: "${name}"`);
			return;
		}

		const svg = document.createElementNS(SVG_NS, "svg");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("width", size);
		svg.setAttribute("height", size);
		svg.setAttribute("stroke", color);
		svg.setAttribute("stroke-width", "1.75");
		svg.setAttribute("aria-hidden", "true");
		svg.setAttribute("focusable", "false");
		svg.style.strokeLinecap = "square";
		svg.style.strokeLinejoin = "miter";
		// geometry is a static, trusted constant (never user-controlled)
		svg.innerHTML = geometry;

		this.shadow.innerHTML = "";
		this.shadow.appendChild(svg);
	}
}

customElements.define("tn-icon", TnIcon);
