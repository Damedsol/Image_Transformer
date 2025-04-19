import { ImageInfo, ConversionOptions, ConversionStatus } from '../types/image';
import {
  DropZoneElement,
  ImagePreviewElement,
  ConversionOptionsElement,
} from '../types/components';
import { prepareImageFile, simulateFileUpload } from '../utils/fileUtils';

/**
 * Componente principal para el conversor de imágenes
 */
export class ImageConverter extends HTMLElement {
  private images: ImageInfo[] = [];
  private options: ConversionOptions;
  private status: ConversionStatus = 'idle';

  constructor() {
    super();
    this.options = {
      format: 'png',
      quality: 90,
      maintainAspectRatio: true,
    };
  }

  /**
   * Callback que se ejecuta cuando el componente se conecta al DOM
   */
  connectedCallback() {
    this.render();
    this.setupComponents();
  }

  /**
   * Configura los componentes hijos y sus event listeners
   */
  private setupComponents() {
    // Componente DropZone
    const dropZone = this.querySelector('drop-zone') as DropZoneElement;
    if (dropZone) {
      dropZone.setOnFilesSelectedCallback(this.handleFilesSelected.bind(this));
    }

    // Componente ConversionOptions
    const conversionOptions = this.querySelector('conversion-options') as ConversionOptionsElement;
    if (conversionOptions) {
      conversionOptions.setOnChangeCallback(this.handleOptionsChange.bind(this));
    }

    // Botón de conversión
    const convertButton = this.querySelector('#convert-button');
    if (convertButton) {
      convertButton.addEventListener('click', this.handleConvertClick.bind(this));
    }
  }

  /**
   * Maneja la selección de archivos desde el DropZone
   */
  private async handleFilesSelected(files: FileList) {
    try {
      // Cambiamos el estado a procesando
      this.updateStatus('processing');

      // Preparamos cada archivo
      const promises = Array.from(files).map(async (file) => {
        try {
          const imageInfo = await prepareImageFile(file);
          this.images.push(imageInfo);
          return imageInfo;
        } catch (error) {
          console.error('Error al procesar el archivo:', error);
          this.showMessage(`Error al procesar el archivo ${file.name}`, 'error');
          return null;
        }
      });

      // Esperamos a que se procesen todos los archivos
      const results = await Promise.all(promises);
      const validImages = results.filter(Boolean) as ImageInfo[];

      // Actualizamos las previsualizaciones
      this.updatePreviews();

      // Mostramos mensaje de éxito
      if (validImages.length > 0) {
        this.showMessage(
          `${validImages.length} imagen${validImages.length > 1 ? 'es' : ''} cargada${validImages.length > 1 ? 's' : ''} correctamente`,
          'success',
        );
      }

      // Actualizamos el estado
      this.updateStatus('idle');
    } catch (error) {
      console.error('Error al seleccionar archivos:', error);
      this.showMessage('Error al seleccionar archivos', 'error');
      this.updateStatus('error');
    }
  }

  /**
   * Maneja los cambios en las opciones de conversión
   */
  private handleOptionsChange(options: ConversionOptions) {
    this.options = options;

    // Actualiza las opciones de conversión para todas las imágenes
    this.images = this.images.map((img) => ({
      ...img,
      conversionOptions: {
        ...img.conversionOptions,
        ...options,
      },
    }));
  }

  /**
   * Maneja el clic en el botón de conversión
   */
  private async handleConvertClick() {
    if (this.images.length === 0) {
      this.showMessage('Por favor, selecciona al menos una imagen para convertir', 'error');
      return;
    }

    if (this.status === 'processing') {
      return;
    }

    try {
      // Cambiamos el estado a procesando
      this.updateStatus('processing');

      // Simulamos la carga de archivos (en una app real, esto enviaría los archivos al servidor)
      const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;
      if (convertButton) {
        convertButton.disabled = true;
        convertButton.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          Convirtiendo...
        `;
      }

      // Simulamos la conversión en el servidor
      const downloadUrls = await simulateFileUpload(this.images, this.options);

      // Actualizamos el estado
      this.updateStatus('success');

      // Mostramos mensaje de éxito
      this.showMessage(
        `${this.images.length} imagen${this.images.length > 1 ? 'es' : ''} convertida${this.images.length > 1 ? 's' : ''} correctamente`,
        'success',
      );

      // En una app real, aquí se redireccionaría a los URLs de descarga
      this.simulateDownloads(downloadUrls);

      // Restauramos el botón
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.innerHTML = 'Convertir imágenes';
      }
    } catch (error) {
      console.error('Error al convertir imágenes:', error);
      this.showMessage('Error al convertir imágenes', 'error');
      this.updateStatus('error');

      // Restauramos el botón
      const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.innerHTML = 'Convertir imágenes';
      }
    }
  }

  /**
   * Simula la descarga de archivos (solo para desarrollo frontend)
   */
  private simulateDownloads(urls: string[]) {
    // Creamos un contenedor para los enlaces de descarga
    const downloadsContainer = document.createElement('div');
    downloadsContainer.className = 'downloads-container';
    downloadsContainer.innerHTML = `
        <h3>Descargas disponibles</h3>
        <ul class="downloads-list">
            ${urls
              .map(
                (url, index) => `
                        <li>
                            <a href="#" class="download-link" data-index="${index}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                ${this.images[index]?.name || `Imagen ${index + 1}`} (${this.options.format})
                            </a>
                        </li>
                    `,
              )
              .join('')}
        </ul>
    `;

    // Agregamos event listeners para simular descargas
    const downloadLinks = downloadsContainer.querySelectorAll('.download-link');
    downloadLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const index = parseInt(
          (e.currentTarget as HTMLElement).getAttribute('data-index') || '0',
          10,
        );
        this.showMessage(
          `Descarga iniciada: ${this.images[index]?.name || `Imagen ${index + 1}`}`,
          'success',
        );
      });
    });

    // Buscamos si ya existe un contenedor de descargas
    const existingContainer = this.querySelector('.downloads-container');
    if (existingContainer) {
      existingContainer.replaceWith(downloadsContainer);
    } else {
      // Insertamos el contenedor en el content-actions
      const actionsContainer = this.querySelector('.action-container');
      if (actionsContainer) {
        actionsContainer.insertBefore(downloadsContainer, actionsContainer.firstChild);
      }
    }
  }

  /**
   * Actualiza las previsualizaciones de las imágenes
   */
  private updatePreviews() {
    const previewArea = this.querySelector('.preview-area');
    if (!previewArea) return;

    // Limpiamos el área de previsualización
    previewArea.innerHTML = '';

    // Si no hay imágenes, mostramos un mensaje
    if (this.images.length === 0) {
      previewArea.innerHTML = `
        <div class="no-images">
          <p>No hay imágenes seleccionadas</p>
        </div>
      `;
      return;
    }

    // Creamos las previsualizaciones para cada imagen
    this.images.forEach((imageInfo) => {
      const preview = document.createElement('image-preview') as ImagePreviewElement;
      preview.image = imageInfo;
      preview.setOnRemoveCallback(this.handleRemoveImage.bind(this));
      previewArea.appendChild(preview);
    });
  }

  /**
   * Maneja la eliminación de una imagen
   */
  private handleRemoveImage(id: string) {
    // Filtramos la imagen a eliminar
    this.images = this.images.filter((img) => img.id !== id);

    // Actualizamos las previsualizaciones
    this.updatePreviews();

    // Si no quedan imágenes, ocultamos las descargas
    if (this.images.length === 0) {
      const downloadsContainer = this.querySelector('.downloads-container');
      if (downloadsContainer) {
        downloadsContainer.remove();
      }
    }
  }

  /**
   * Actualiza el estado de la conversión
   */
  private updateStatus(status: ConversionStatus) {
    this.status = status;

    // Actualizamos la UI según el estado
    const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;

    if (convertButton) {
      convertButton.disabled = status === 'processing';

      if (status === 'processing') {
        convertButton.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          Procesando...
        `;
      } else {
        convertButton.innerHTML = 'Convertir imágenes';
      }
    }
  }

  /**
   * Muestra un mensaje de error o éxito
   */
  private showMessage(text: string, type: 'error' | 'success') {
    const messagesContainer = this.querySelector('.messages-container');
    if (!messagesContainer) return;

    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.textContent = text;

    // Agregamos el mensaje al contenedor
    messagesContainer.appendChild(message);

    // Eliminamos el mensaje después de 5 segundos
    setTimeout(() => {
      if (message && message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 5000);
  }

  /**
   * Renderiza el componente
   */
  private render() {
    this.innerHTML = `
      <div class="app-container">
        <header class="header">
          <h1>Conversor de Imágenes</h1>
          <p>Convierte tus imágenes a diferentes formatos de manera rápida y sencilla</p>
        </header>
        
        <div class="messages-container"></div>
        
        <div class="converter-container">
          <drop-zone></drop-zone>
          
          <div class="preview-section">
            <h2>Imágenes seleccionadas</h2>
            <div class="preview-area"></div>
          </div>
          
          <conversion-options></conversion-options>
          
          <div class="action-container">
            <button 
              id="convert-button" 
              class="btn btn-primary convert-btn" 
              aria-label="Convertir imágenes seleccionadas"
            >
              Convertir imágenes
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define('image-converter', ImageConverter);
