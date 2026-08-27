import { ImageInfo, ConversionOptions, ConversionStatus } from "../types/image";
import { DropZoneElement, ConversionOptionsElement } from "../types/components";
import { prepareImageFile } from "../utils/fileUtils";
import { convertImagesAPI } from "../utils/api";
import { logApiError } from "../utils/logger";
import "./TnIcon";

/**
 * Main ImageConverter component (SNA-01 Buttons + SNA-15 Loaders + SNA-07 Alerts)
 */
export class ImageConverter extends HTMLElement {
	private images: ImageInfo[] = [];
	private options: ConversionOptions;
	private status: ConversionStatus = "idle";
	private statusAnnouncer: HTMLElement | null = null;

	constructor() {
		super();
		this.options = {
			format: "png",
			quality: 90,
			maintainAspectRatio: true,
		};
	}

	connectedCallback() {
		this.render();
		this.setupComponents();
		this.statusAnnouncer = document.getElementById("status-announcer");
		this.setAttribute("role", "region");
		this.setAttribute("aria-label", "Image converter");
	}

	private setupComponents() {
		const dropZone = this.querySelector("drop-zone") as DropZoneElement;
		if (dropZone) {
			dropZone.setOnFilesSelectedCallback(this.handleFilesSelected.bind(this));
		}

		const conversionOptions = this.querySelector(
			"conversion-options",
		) as ConversionOptionsElement;
		if (conversionOptions) {
			conversionOptions.setOnChangeCallback(
				this.handleOptionsChange.bind(this),
			);
		}

		const convertButton = this.querySelector("#convert-button");
		if (convertButton) {
			convertButton.addEventListener(
				"click",
				this.handleConvertClick.bind(this),
			);
			convertButton.setAttribute("aria-live", "polite");
		}

		this.handleKeyboardNavigation();
	}

	private handleKeyboardNavigation() {
		this.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				const target = e.target as HTMLElement;
				if (target.classList.contains("preview-item")) {
					e.preventDefault();
					const removeBtn = target.querySelector(".preview-remove");
					if (removeBtn) {
						(removeBtn as HTMLElement).click();
					}
				}
			}
		});
	}

	private announceStatus(message: string) {
		if (this.statusAnnouncer) {
			this.statusAnnouncer.textContent = message;
		}
	}

	private getErrorMessage(error: unknown, fallback: string): string {
		return error instanceof Error && error.message ? error.message : fallback;
	}

	private escapeHtml(value: string): string {
		return value.replace(/[&<>"']/g, (char) => {
			const entities: Record<string, string> = {
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			};
			return entities[char];
		});
	}

	private async handleFilesSelected(files: FileList) {
		try {
			this.announceStatus("Processing images, please wait...");
			this.updateStatus("processing");

			const promises = Array.from(files).map(async (file) => {
				try {
					const imageInfo = await prepareImageFile(file);
					this.images.push(imageInfo);
					return imageInfo;
				} catch (error) {
					logApiError("processFile", error);
					this.showMessage(
						this.getErrorMessage(error, "Error processing file"),
						"error",
					);
					return null;
				}
			});

			const results = await Promise.all(promises);
			const validImages = results.filter(Boolean) as ImageInfo[];

			this.updatePreviews();

			if (validImages.length > 0) {
				const summary = `${validImages.length} image${validImages.length > 1 ? "s" : ""} loaded`;
				this.announceStatus(summary);
				this.showMessage(summary, "success");
			}

			this.updateStatus("idle");
		} catch (error) {
			logApiError("selectFiles", error);
			this.showMessage(
				this.getErrorMessage(error, "Error selecting files"),
				"error",
			);
			this.updateStatus("error");
			this.announceStatus("Error loading images.");
		}
	}

	private handleOptionsChange(options: ConversionOptions) {
		this.options = options;
		this.images = this.images.map((img) => ({
			...img,
			conversionOptions: { ...img.conversionOptions, ...options },
		}));
		this.announceStatus(
			`Conversion options updated: ${options.format}, quality ${options.quality}%`,
		);
	}

	private async handleConvertClick() {
		if (this.images.length === 0) {
			this.showMessage("No images selected for conversion", "error");
			this.announceStatus("Error: No images selected");
			return;
		}

		if (this.status === "processing") return;

		try {
			this.announceStatus("Starting conversion...");
			this.updateStatus("processing");

			const convertButton = this.querySelector(
				"#convert-button",
			) as HTMLButtonElement;
			if (convertButton) {
				convertButton.disabled = true;
				convertButton.setAttribute("aria-busy", "true");
				convertButton.innerHTML = `
            <span class="loader-spinner"></span>
            Converting...
          `;
			}

			const zipUrl = await convertImagesAPI(this.images, this.options);

			this.updateStatus("success");
			this.announceStatus(`${this.images.length} images converted. ZIP ready.`);
			this.showMessage(
				`${this.images.length} images converted successfully`,
				"success",
			);
			this.createDownloadLink(zipUrl);

			if (convertButton) {
				convertButton.disabled = false;
				convertButton.setAttribute("aria-busy", "false");
				convertButton.innerHTML = "Convert Images";
			}
		} catch (error) {
			logApiError("convertImages", error);
			this.showMessage(
				this.getErrorMessage(error, "Error converting images"),
				"error",
			);
			this.announceStatus("Error during conversion.");
			this.updateStatus("error");

			const convertButton = this.querySelector(
				"#convert-button",
			) as HTMLButtonElement;
			if (convertButton) {
				convertButton.disabled = false;
				convertButton.setAttribute("aria-busy", "false");
				convertButton.innerHTML = "Convert Images";
			}
		}
	}

	private createDownloadLink(zipUrl: string) {
		const downloadsContainer = document.createElement("div");
		downloadsContainer.className = "downloads-container";
		downloadsContainer.setAttribute("role", "region");
		downloadsContainer.setAttribute("aria-label", "Download links");

		const heading = document.createElement("h3");
		heading.textContent = "Available downloads";

		const list = document.createElement("ul");
		list.className = "downloads-list";
		list.setAttribute("aria-label", "Download links");

		const item = document.createElement("li");
		const link = document.createElement("a");
		link.className = "download-link";
		link.href = zipUrl;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.setAttribute("aria-label", "Download ZIP");

		const icon = document.createElement("tn-icon");
		icon.setAttribute("name", "download");
		icon.setAttribute("size", "16");
		link.appendChild(icon);
		link.appendChild(document.createTextNode("Download all (ZIP)"));

		item.appendChild(link);
		list.appendChild(item);
		downloadsContainer.appendChild(heading);
		downloadsContainer.appendChild(list);

		const existingContainer = this.querySelector(".downloads-container");
		if (existingContainer) {
			existingContainer.replaceWith(downloadsContainer);
		} else {
			const actionsContainer = this.querySelector(".action-container");
			if (actionsContainer) {
				actionsContainer.insertBefore(
					downloadsContainer,
					actionsContainer.firstChild,
				);
			}
		}
	}

	private updatePreviews() {
		const previewArea = this.querySelector(".preview-area");
		if (!previewArea) return;

		previewArea.setAttribute("role", "list");
		previewArea.setAttribute("aria-label", "Image previews");
		previewArea.innerHTML = "";

		if (this.images.length === 0) {
			const noImagesElement = document.createElement("div");
			noImagesElement.className = "no-images";
			noImagesElement.setAttribute("role", "status");
			noImagesElement.innerHTML = `
          <tn-icon name="image" size="48" color="var(--text-muted)"></tn-icon>
          <p>No images selected yet</p>
        `;
			previewArea.appendChild(noImagesElement);
			return;
		}

		this.images.forEach((image, index) => {
			const previewItem = document.createElement("div");
			previewItem.className = "preview-item";
			previewItem.setAttribute("role", "listitem");
			previewItem.setAttribute("tabindex", "0");
			previewItem.setAttribute(
				"aria-label",
				`Image ${index + 1}: ${image.name}`,
			);

			previewItem.innerHTML = `
            <img src="${image.preview}" alt="${image.name}" loading="lazy" />
            <div class="preview-info">
              <div class="preview-name">${image.name}</div>
              <div class="preview-meta">${(image.size / 1024).toFixed(2)} KB</div>
            </div>
            <div class="preview-actions">
              <button class="btn-outline preview-remove" data-id="${image.id}" aria-label="Remove image ${image.name}">
                <tn-icon name="trash" size="14"></tn-icon>
                Remove
              </button>
            </div>
          `;

			const removeBtn = previewItem.querySelector(".preview-remove");
			if (removeBtn) {
				removeBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					this.handleRemoveImage(image.id);
				});
			}

			previewArea.appendChild(previewItem);
		});
	}

	private handleRemoveImage(id: string) {
		const imageToRemove = this.images.find((img) => img.id === id);
		const imageName = imageToRemove?.name || "Image";
		this.images = this.images.filter((img) => img.id !== id);
		this.updatePreviews();
		this.showMessage(`Image ${imageName} removed`, "success");
		this.announceStatus(
			`Image ${imageName} removed. ${this.images.length} remaining.`,
		);
	}

	private updateStatus(status: ConversionStatus) {
		this.status = status;
		const convertContainer = this.querySelector(".converter-container");
		if (convertContainer) {
			convertContainer.classList.remove(
				"status-idle",
				"status-processing",
				"status-success",
				"status-error",
			);
			convertContainer.classList.add(`status-${status}`);
			convertContainer.setAttribute(
				"aria-busy",
				status === "processing" ? "true" : "false",
			);
		}
	}

	private showMessage(text: string, type: "error" | "success") {
		let messageElement = this.querySelector(".message");
		if (!messageElement) {
			messageElement = document.createElement("div");
			messageElement.className = "message";
			messageElement.setAttribute("role", "alert");
			messageElement.setAttribute("aria-live", "assertive");
			this.appendChild(messageElement);
		}
		messageElement.className = `message message-${type}`;
		const iconName = type === "error" ? "alert" : "check";
		messageElement.innerHTML = `
        <tn-icon name="${iconName}" size="16"></tn-icon>
        <span>${this.escapeHtml(text)}</span>
      `;
		setTimeout(() => {
			if (messageElement && messageElement.parentNode) {
				messageElement.parentNode.removeChild(messageElement);
			}
		}, 5000);
	}

	private render() {
		this.innerHTML = `
      <div class="app-container">
        <header class="header">
          <h1>Image Converter</h1>
          <p>Convert your images to different formats in seconds</p>
        </header>

        <div class="converter-container">
          <section class="upload-section">
            <h2 id="upload-heading" class="sr-only">Upload images</h2>
            <drop-zone aria-labelledby="upload-heading"></drop-zone>
          </section>

          <section class="preview-section">
            <h2>Selected images</h2>
            <div class="preview-area" aria-labelledby="preview-heading"></div>
          </section>

          <section class="options-section">
            <conversion-options></conversion-options>
          </section>

          <div class="action-container">
            <button id="convert-button" class="btn-primary" aria-describedby="convert-description">
              Convert Images
            </button>
            <span id="convert-description" class="sr-only">
              Convert all selected images to the chosen format
            </span>
          </div>
        </div>
      </div>
    `;
	}
}

customElements.define("image-converter", ImageConverter);
