import { ImageInfo } from '../types/image';
import { formatFileSize } from '../utils/fileUtils';

/**
 * Component to show preview of selected images
 */
export class ImagePreview extends HTMLElement {
  private imageInfo!: ImageInfo;
  private onRemove: (id: string) => void;

  constructor() {
    super();
    this.onRemove = () => {};
  }

  /**
   * Setter for image information
   */
  set image(imageInfo: ImageInfo) {
    this.imageInfo = imageInfo;
    this.render();
    this.setupEventListeners();
  }

  /**
   * Getter for image information
   */
  get image(): ImageInfo {
    return this.imageInfo;
  }

  /**
   * Registers the callback for when an image is removed
   */
  public setOnRemoveCallback(callback: (id: string) => void) {
    this.onRemove = callback;
  }

  /**
   * Sets up event listeners for the remove button
   */
  private setupEventListeners() {
    const removeButton = this.querySelector('.preview-remove');
    if (removeButton) {
      removeButton.addEventListener('click', () => {
        this.onRemove(this.imageInfo.id);
      });
    }
  }

  /**
   * Renders the component
   */
  private render() {
    if (!this.imageInfo) return;

    const { preview, name, size, dimensions } = this.imageInfo;
    const formattedSize = formatFileSize(size);
    const dimensionsText = dimensions ? `${dimensions.width} × ${dimensions.height}` : 'Unknown';

    this.innerHTML = `
      <div class="preview-item" id="preview-${this.imageInfo.id}">
        <img 
          src="${preview}" 
          alt="${name}" 
          class="preview-image"
          loading="lazy"
        />
        <div class="preview-info">
          <h3 class="preview-name" title="${name}">${name}</h3>
          <div class="preview-meta">
            <span>${formattedSize}</span>
            <span>${dimensionsText}</span>
          </div>
          <button 
            type="button" 
            class="preview-remove btn btn-outline" 
            aria-label="Remove image ${name}"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Remove
          </button>
        </div>
      </div>
    `;
  }
}

// Register the component
customElements.define('image-preview', ImagePreview);
