import { ImageInfo, ConversionOptions, ConversionStatus } from '../types/image';
import { DropZoneElement, ConversionOptionsElement } from '../types/components';
import { prepareImageFile } from '../utils/fileUtils';
import { convertImagesAPI } from '../utils/api';

/**
 * Componente principal para el conversor de imágenes
 */
export class ImageConverter extends HTMLElement {
  private images: ImageInfo[] = [];
  private options: ConversionOptions;
  private status: ConversionStatus = 'idle';
  private statusAnnouncer: HTMLElement | null = null;

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
    this.statusAnnouncer = document.getElementById('status-announcer');
    // Añadir roles de accesibilidad
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Conversor de imágenes');
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
      // Mejora de accesibilidad: añadir roles y atributos ARIA
      convertButton.setAttribute('aria-live', 'polite');
    }

    // Manejar navegación con teclado para el área de previsualización
    this.handleKeyboardNavigation();
  }

  /**
   * Configura la navegación con teclado para mejorar la accesibilidad
   */
  private handleKeyboardNavigation() {
    // Permitir que el usuario pueda navegar entre previsualizaciones con el teclado
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target.classList.contains('preview-item')) {
          e.preventDefault();
          // Emular un clic en el botón de eliminar si está presente
          const removeBtn = target.querySelector('.remove-image-btn');
          if (removeBtn) {
            (removeBtn as HTMLElement).click();
          }
        }
      }
    });
  }

  /**
   * Anuncia mensajes para lectores de pantalla
   */
  private announceStatus(message: string) {
    if (this.statusAnnouncer) {
      this.statusAnnouncer.textContent = message;
    }
  }

  /**
   * Maneja la selección de archivos desde el DropZone
   */
  private async handleFilesSelected(files: FileList) {
    try {
      // Anunciar estado para lectores de pantalla
      this.announceStatus('Procesando imágenes, por favor espere...');

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

      // Anunciar para lectores de pantalla
      if (validImages.length > 0) {
        this.announceStatus(
          `${validImages.length} imagen${validImages.length > 1 ? 'es' : ''} cargada${validImages.length > 1 ? 's' : ''} correctamente. Ya puede convertirlas.`,
        );
      }

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
      this.announceStatus('Error al cargar las imágenes. Por favor, inténtelo de nuevo.');
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

    // Anunciar cambios para lectores de pantalla
    this.announceStatus(
      `Opciones de conversión actualizadas: formato ${options.format}, calidad ${options.quality}%`,
    );
  }

  /**
   * Maneja el clic en el botón de conversión
   */
  private async handleConvertClick() {
    if (this.images.length === 0) {
      this.showMessage('Por favor, selecciona al menos una imagen para convertir', 'error');
      this.announceStatus('Error: No hay imágenes seleccionadas para convertir');
      return;
    }

    if (this.status === 'processing') {
      return;
    }

    try {
      // Anunciar estado para lectores de pantalla
      this.announceStatus('Iniciando conversión de imágenes, por favor espere...');

      // Cambiamos el estado a procesando
      this.updateStatus('processing');

      // Actualizar la UI para mostrar que estamos procesando
      const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;
      if (convertButton) {
        convertButton.disabled = true;
        convertButton.setAttribute('aria-busy', 'true');
        convertButton.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          Convirtiendo...
        `;
      }

      // Llamar a la API para convertir las imágenes
      const zipUrl = await convertImagesAPI(this.images, this.options);

      // Actualizamos el estado
      this.updateStatus('success');

      // Anunciar para lectores de pantalla
      this.announceStatus(
        `${this.images.length} imagen${this.images.length > 1 ? 'es' : ''} convertida${this.images.length > 1 ? 's' : ''} correctamente. El archivo ZIP está disponible para descarga.`,
      );

      // Mostramos mensaje de éxito
      this.showMessage(
        `${this.images.length} imagen${this.images.length > 1 ? 'es' : ''} convertida${this.images.length > 1 ? 's' : ''} correctamente`,
        'success',
      );

      // Mostrar enlace de descarga del ZIP
      this.createDownloadLink(zipUrl);

      // Restauramos el botón
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.setAttribute('aria-busy', 'false');
        convertButton.innerHTML = 'Convertir imágenes';
      }
    } catch (error) {
      console.error('Error al convertir imágenes:', error);
      this.showMessage('Error al convertir imágenes', 'error');
      this.announceStatus('Error durante la conversión de imágenes.');
      this.updateStatus('error');

      // Restauramos el botón
      const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.setAttribute('aria-busy', 'false');
        convertButton.innerHTML = 'Convertir imágenes';
      }
    }
  }

  /**
   * Crea un enlace para descargar el archivo ZIP
   */
  private createDownloadLink(zipUrl: string) {
    // Creamos un contenedor para el enlace de descarga
    const downloadsContainer = document.createElement('div');
    downloadsContainer.className = 'downloads-container';
    downloadsContainer.setAttribute('role', 'region');
    downloadsContainer.setAttribute('aria-label', 'Enlaces de descarga');

    downloadsContainer.innerHTML = `
        <h3 id="download-heading">Descargas disponibles</h3>
        <ul class="downloads-list" aria-labelledby="download-heading">
            <li>
                <a href="${zipUrl}" class="download-link" target="_blank" aria-label="Descargar todas las imágenes convertidas en formato ZIP">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Descargar todas las imágenes (ZIP)
                </a>
            </li>
        </ul>
    `;

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
   * Simula la descarga de archivos (solo para desarrollo frontend)
   */
  private simulateDownloads(urls: string[]) {
    // Este método se mantiene por compatibilidad, pero ahora
    // utilizamos createDownloadLink para manejar la descarga del ZIP
    console.log('Método legacy: simulateDownloads', urls);
  }

  /**
   * Actualiza las previsualizaciones de las imágenes
   */
  private updatePreviews() {
    const previewArea = this.querySelector('.preview-area');
    if (!previewArea) return;

    // Añadir atributos de accesibilidad al área de vista previa
    previewArea.setAttribute('role', 'list');
    previewArea.setAttribute('aria-label', 'Previsualización de imágenes');

    // Limpiamos el área de previsualización
    previewArea.innerHTML = '';

    // Si no hay imágenes, mostramos un mensaje
    if (this.images.length === 0) {
      const noImagesElement = document.createElement('div');
      noImagesElement.className = 'no-images';
      noImagesElement.setAttribute('role', 'status');
      noImagesElement.innerHTML = `
        <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p>No hay imágenes seleccionadas</p>
      `;
      previewArea.appendChild(noImagesElement);
      return;
    }

    // Agregar previsualizaciones para cada imagen
    this.images.forEach((image, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.setAttribute('role', 'listitem');
      previewItem.setAttribute('tabindex', '0');
      previewItem.setAttribute('aria-label', `Imagen ${index + 1}: ${image.name}`);

      // Crear contenido de previsualización
      previewItem.innerHTML = `
        <img src="${image.preview}" alt="${image.name}" loading="lazy" />
        <div class="preview-info">
          <div class="preview-name">${image.name}</div>
          <div class="preview-meta">${(image.size / 1024).toFixed(2)} KB</div>
        </div>
        <button class="remove-image-btn" data-id="${image.id}" aria-label="Eliminar imagen ${image.name}">
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Agregar event listener para eliminar imagen
      const removeBtn = previewItem.querySelector('.remove-image-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleRemoveImage(image.id);
        });
      }

      previewArea.appendChild(previewItem);
    });
  }

  /**
   * Maneja la eliminación de una imagen
   */
  private handleRemoveImage(id: string) {
    // Buscar la imagen a eliminar
    const imageToRemove = this.images.find((img) => img.id === id);
    const imageName = imageToRemove?.name || 'Imagen';

    // Filtrar las imágenes para eliminar la seleccionada
    this.images = this.images.filter((img) => img.id !== id);

    // Actualizar previsualizaciones
    this.updatePreviews();

    // Mostrar mensaje
    this.showMessage(`Imagen ${imageName} eliminada`, 'success');

    // Anunciar para lectores de pantalla
    this.announceStatus(`Imagen ${imageName} eliminada. ${this.images.length} imágenes restantes.`);
  }

  /**
   * Actualiza el estado del convertidor
   */
  private updateStatus(status: ConversionStatus) {
    this.status = status;
    const convertContainer = this.querySelector('.converter-container');

    if (convertContainer) {
      // Remover clases de estado anteriores
      convertContainer.classList.remove(
        'status-idle',
        'status-processing',
        'status-success',
        'status-error',
      );

      // Agregar nueva clase de estado
      convertContainer.classList.add(`status-${status}`);

      // Actualizar atributo ARIA para anunciar el estado
      convertContainer.setAttribute('aria-busy', status === 'processing' ? 'true' : 'false');
    }
  }

  /**
   * Muestra un mensaje informativo
   */
  private showMessage(text: string, type: 'error' | 'success') {
    // Buscar si ya existe un mensaje
    let messageElement = this.querySelector('.message');

    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'message';
      messageElement.setAttribute('role', 'alert');
      messageElement.setAttribute('aria-live', 'assertive');
      this.appendChild(messageElement);
    }

    // Actualizar clase y contenido del mensaje
    messageElement.className = `message message-${type}`;
    messageElement.textContent = text;

    // Eliminar el mensaje después de un tiempo
    setTimeout(() => {
      if (messageElement && messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
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
          <p>Convierte tus imágenes a diferentes formatos en segundos</p>
        </header>
        
        <div class="converter-container" role="application">
          <section class="upload-section">
            <h2 id="upload-heading" class="sr-only">Subir imágenes</h2>
            <drop-zone aria-labelledby="upload-heading"></drop-zone>
          </section>
          
          <section class="preview-section">
            <h2 id="preview-heading">Imágenes seleccionadas</h2>
            <div class="preview-area" aria-labelledby="preview-heading"></div>
          </section>
          
          <section class="options-section" aria-labelledby="options-component">
            <conversion-options id="options-component"></conversion-options>
          </section>
          
          <div class="action-container">
            <button id="convert-button" class="btn btn-primary convert-btn" aria-describedby="convert-description">
              Convertir imágenes
            </button>
            <span id="convert-description" class="sr-only">
              Convierte todas las imágenes seleccionadas al formato elegido
            </span>
          </div>
        </div>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define('image-converter', ImageConverter);
