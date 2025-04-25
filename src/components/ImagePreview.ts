import { ImageInfo } from '../types/image';
import { formatFileSize } from '../utils/fileUtils';

/**
 * Componente para mostrar la vista previa de las imágenes seleccionadas
 */
export class ImagePreview extends HTMLElement {
  private imageInfo: ImageInfo;
  private onRemove: (id: string) => void;

  constructor() {
    super();
    this.onRemove = () => {};
  }

  /**
   * Setter para la información de la imagen
   */
  set image(imageInfo: ImageInfo) {
    this.imageInfo = imageInfo;
    this.render();
    this.setupEventListeners();
  }

  /**
   * Getter para la información de la imagen
   */
  get image(): ImageInfo {
    return this.imageInfo;
  }

  /**
   * Registra el callback para cuando se elimina una imagen
   */
  public setOnRemoveCallback(callback: (id: string) => void) {
    this.onRemove = callback;
  }

  /**
   * Configura los event listeners para el botón de eliminar
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
   * Renderiza el componente
   */
  private render() {
    if (!this.imageInfo) return;

    const { preview, name, size, dimensions } = this.imageInfo;
    const formattedSize = formatFileSize(size);
    const dimensionsText = dimensions
      ? `${dimensions.width} × ${dimensions.height}`
      : 'Desconocido';

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
            aria-label="Eliminar imagen ${name}"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define('image-preview', ImagePreview);
