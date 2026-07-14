/**
 * <tn-icon> — Lucide-based icon Web Component (SNA-36)
 *
 * Imports only needed icons (tree-shaking). Shadows DOM to protect SVG integrity.
 * Features: square stroke-linecap, miter stroke-linejoin, aria-hidden by default.
 */
import { createElement } from "lucide";
import type { IconNode } from "lucide";
import {
	Upload,
	CheckCircle,
	AlertCircle,
	X,
	Settings,
	ChevronDown,
	Trash2,
	Download,
	Image,
	Info,
	HelpCircle,
	FileImage,
	Sun,
	Moon,
	MoveUp,
} from "lucide";

const LucideRegistry: Record<string, IconNode> = {
	upload: Upload,
	check: CheckCircle,
	alert: AlertCircle,
	x: X,
	settings: Settings,
	chevronDown: ChevronDown,
	trash: Trash2,
	download: Download,
	image: Image,
	info: Info,
	help: HelpCircle,
	fileImage: FileImage,
	sun: Sun,
	moon: Moon,
	moveUp: MoveUp,
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

		const IconComponent = LucideRegistry[name];
		if (!IconComponent) {
			console.warn(`[tn-icon] Unknown icon: "${name}"`);
			return;
		}

		const svg = createElement(IconComponent);
		svg.setAttribute("width", size);
		svg.setAttribute("height", size);
		svg.setAttribute("stroke", color);
		svg.setAttribute("stroke-width", "1.75");
		svg.setAttribute("aria-hidden", "true");
		svg.setAttribute("focusable", "false");
		svg.style.strokeLinecap = "square";
		svg.style.strokeLinejoin = "miter";

		this.shadow.innerHTML = "";
		this.shadow.appendChild(svg);
	}
}

customElements.define("tn-icon", TnIcon);
