import { isValidImage } from "../utils/fileUtils";
import "./TnIcon";

/**
 * DropZone component (SNA-03 Card + SNA-35 Empty State)
 */
export class DropZone extends HTMLElement {
	private dropArea!: HTMLElement;
	private fileInput!: HTMLInputElement;
	private onFilesSelected: (files: FileList) => void;
	private statusElement!: HTMLElement;

	constructor() {
		super();
		this.onFilesSelected = () => {};
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
	}

	private setupEventListeners() {
		this.dropArea = this.querySelector(".dropzone") as HTMLElement;
		this.fileInput = this.querySelector(".file-input") as HTMLInputElement;
		this.statusElement = this.querySelector(".dropzone-status") as HTMLElement;

		this.dropArea.addEventListener("dragover", this.handleDragOver.bind(this));
		this.dropArea.addEventListener(
			"dragleave",
			this.handleDragLeave.bind(this),
		);
		this.dropArea.addEventListener("drop", this.handleDrop.bind(this));
		this.fileInput.addEventListener("change", this.handleFileSelect.bind(this));
		this.dropArea.addEventListener("click", this.handleAreaClick.bind(this));

		this.dropArea.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				this.fileInput.click();
				this.updateStatus("Selecting files...");
			}
		});

		this.dropArea.addEventListener("focus", () => {
			this.dropArea.classList.add("focus-visible");
		});
		this.dropArea.addEventListener("blur", () => {
			this.dropArea.classList.remove("focus-visible");
		});
	}

	private updateStatus(message: string) {
		if (this.statusElement) {
			this.statusElement.textContent = message;
		}
	}

	public setOnFilesSelectedCallback(callback: (files: FileList) => void) {
		this.onFilesSelected = callback;
	}

	private handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.dropArea.classList.add("drag-active");
		this.updateStatus("Drop to load images");
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "copy";
		}
	}

	private handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.dropArea.classList.remove("drag-active");
		this.updateStatus("");
	}

	private handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.dropArea.classList.remove("drag-active");
		this.updateStatus("Processing dropped files...");

		if (event.dataTransfer && event.dataTransfer.files.length > 0) {
			const files = this.filterImageFiles(event.dataTransfer.files);
			if (files.length > 0) {
				this.updateStatus(`${files.length} images loaded successfully`);
				this.onFilesSelected(files);
			} else {
				this.updateStatus("No valid images loaded");
				this.showError("Only image files are allowed");
			}
		}
	}

	private handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		this.updateStatus("Processing selected files...");

		if (input.files && input.files.length > 0) {
			const files = this.filterImageFiles(input.files);
			if (files.length > 0) {
				this.updateStatus(`${files.length} images loaded successfully`);
				this.onFilesSelected(files);
			} else {
				this.updateStatus("No valid images loaded");
				this.showError("Only image files are allowed");
			}
		}
		input.value = "";
	}

	private filterImageFiles(fileList: FileList): FileList {
		const validFiles: File[] = [];
		for (let i = 0; i < fileList.length; i++) {
			const file = fileList[i];
			if (isValidImage(file)) {
				validFiles.push(file);
			}
		}
		const dataTransfer = new DataTransfer();
		validFiles.forEach((file) => dataTransfer.items.add(file));
		return dataTransfer.files;
	}

	private showError(message: string) {
		let errorMessage = this.querySelector(".message-error");
		if (!errorMessage) {
			errorMessage = document.createElement("div");
			errorMessage.className = "message message-error";
			errorMessage.setAttribute("role", "alert");
			errorMessage.setAttribute("aria-live", "assertive");
			this.appendChild(errorMessage);
		}
		errorMessage.textContent = message;
		setTimeout(() => {
			if (errorMessage && errorMessage.parentNode) {
				errorMessage.parentNode.removeChild(errorMessage);
			}
		}, 3000);
	}

	private render() {
		this.innerHTML = `
      <div
        class="dropzone empty-state"
        tabindex="0"
        role="button"
        aria-label="Area to drag and drop images"
        aria-describedby="dropzone-instructions"
      >
        <input
          type="file"
          class="file-input"
          accept="image/*"
          multiple
          aria-label="Select images"
        />
        <div class="dropzone-content">
          <div class="empty-state-icon" aria-hidden="true">
            <tn-icon name="upload" size="64" color="var(--card-border)"></tn-icon>
          </div>
          <h3 class="empty-state-title">Upload images</h3>
          <p id="dropzone-instructions" class="empty-state-message">
            Drag and drop your images here, or click to select files
          </p>
          <p class="dropzone-formats">PNG | JPEG | WEBP | GIF | AVIF</p>
          <div class="dropzone-status sr-only" aria-live="polite"></div>
        </div>
      </div>
    `;
	}

	private handleAreaClick(event: MouseEvent) {
		if (event.target !== this.fileInput) {
			this.fileInput.click();
			this.updateStatus("Selecting files...");
		}
	}
}

customElements.define("drop-zone", DropZone);
