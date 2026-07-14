import { ImageInfo } from "../types/image";
import { formatFileSize } from "../utils/fileUtils";
import "./TnIcon";

/**
 * ImagePreview component (SNA-03 Card + SNA-08 Badge)
 */
export class ImagePreview extends HTMLElement {
	private imageInfo!: ImageInfo;
	private onRemove: (id: string) => void;

	constructor() {
		super();
		this.onRemove = () => {};
	}

	set image(imageInfo: ImageInfo) {
		this.imageInfo = imageInfo;
		this.render();
		this.setupEventListeners();
	}

	get image(): ImageInfo {
		return this.imageInfo;
	}

	public setOnRemoveCallback(callback: (id: string) => void) {
		this.onRemove = callback;
	}

	private setupEventListeners() {
		const removeButton = this.querySelector(".preview-remove");
		if (removeButton) {
			removeButton.addEventListener("click", () => {
				this.onRemove(this.imageInfo.id);
			});
		}
	}

	private render() {
		if (!this.imageInfo) return;

		const { preview, name, size, type, dimensions } = this.imageInfo;
		const formattedSize = formatFileSize(size);
		const dimensionsText = dimensions
			? `${dimensions.width} x ${dimensions.height}`
			: "--";
		const formatExt = type.split("/").pop()?.toUpperCase() || "FILE";

		this.innerHTML = `
      <div class="preview-item" id="preview-${this.imageInfo.id}">
        <img
          src="${preview}"
          alt="${name}"
          loading="lazy"
        />
        <div class="preview-info">
          <div class="preview-name" title="${name}">${name}</div>
          <div class="preview-meta">
            <span>${formattedSize}</span>
            <span>${dimensionsText}</span>
            <span class="badge">${formatExt}</span>
          </div>
        </div>
        <div class="preview-actions">
          <button
            type="button"
            class="btn-outline preview-remove"
            aria-label="Remove image ${name}"
          >
            <tn-icon name="trash" size="14"></tn-icon>
            REMOVE
          </button>
        </div>
      </div>
    `;
	}
}

customElements.define("image-preview", ImagePreview);
