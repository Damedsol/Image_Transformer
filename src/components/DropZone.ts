import { isValidImage } from '../utils/fileUtils';

/**
 * Componente DropZone para cargar imágenes mediante drag and drop o clic
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

  /**
   * Callback que se ejecuta cuando el componente se conecta al DOM
   */
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Configura los event listeners para el drag and drop y la selección de archivos
   */
  private setupEventListeners() {
    this.dropArea = this.querySelector('.dropzone') as HTMLElement;
    this.fileInput = this.querySelector('.file-input') as HTMLInputElement;
    this.statusElement = this.querySelector('.dropzone-status') as HTMLElement;

    // Eventos de drag and drop
    this.dropArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropArea.addEventListener('drop', this.handleDrop.bind(this));

    // Evento de selección de archivos a través del input
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Manejar clic en toda la zona para abrir el selector de archivos
    this.dropArea.addEventListener('click', this.handleAreaClick.bind(this));

    // Prevenir que los clics en el contenido interno abran el selector múltiples veces
    const dropzoneContent = this.querySelector('.dropzone-content');
    if (dropzoneContent) {
      dropzoneContent.addEventListener('click', _e => {
        // No detener la propagación para que el clic llegue al dropArea
        // Solo evitamos que el evento se dispare múltiples veces
      });
    }

    // Mejorar la accesibilidad del teclado
    this.dropArea.addEventListener('keydown', e => {
      // Activar el input file al presionar Enter o Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInput.click();
        // Anunciar para lectores de pantalla
        this.updateStatus('Seleccionando archivos...');
      }
    });

    // Añadir feedback de enfoque
    this.dropArea.addEventListener('focus', () => {
      this.dropArea.classList.add('focus-visible');
    });

    this.dropArea.addEventListener('blur', () => {
      this.dropArea.classList.remove('focus-visible');
    });
  }

  /**
   * Actualiza el estado para los lectores de pantalla
   */
  private updateStatus(message: string) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  /**
   * Registra el callback para cuando se seleccionan archivos
   */
  public setOnFilesSelectedCallback(callback: (files: FileList) => void) {
    this.onFilesSelected = callback;
  }

  /**
   * Maneja el evento dragover
   */
  private handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.add('drag-active');
    this.updateStatus('Soltar para cargar las imágenes');

    // Actualiza el cursor para indicar que se puede soltar
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  /**
   * Maneja el evento dragleave
   */
  private handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.remove('drag-active');
    this.updateStatus('');
  }

  /**
   * Maneja el evento drop
   */
  private handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.remove('drag-active');
    this.updateStatus('Procesando archivos soltados...');

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = this.filterImageFiles(event.dataTransfer.files);
      if (files.length > 0) {
        this.updateStatus(`${files.length} imágenes cargadas correctamente`);
        this.onFilesSelected(files);
      } else {
        this.updateStatus('No se han cargado imágenes válidas');
        this.showError('Solo se permiten archivos de imagen');
      }
    }
  }

  /**
   * Maneja la selección de archivos desde el input
   */
  private handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.updateStatus('Procesando archivos seleccionados...');

    if (input.files && input.files.length > 0) {
      const files = this.filterImageFiles(input.files);

      if (files.length > 0) {
        this.updateStatus(`${files.length} imágenes cargadas correctamente`);
        this.onFilesSelected(files);
      } else {
        this.updateStatus('No se han cargado imágenes válidas');
        this.showError('Solo se permiten archivos de imagen');
      }
    }

    // Reinicia el input para permitir seleccionar el mismo archivo nuevamente
    input.value = '';
  }

  /**
   * Filtra archivos que no son imágenes
   */
  private filterImageFiles(fileList: FileList): FileList {
    const validFiles: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (isValidImage(file)) {
        validFiles.push(file);
      }
    }

    // Crear un nuevo objeto FileList (hacemos un truco ya que FileList es inmutable)
    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));

    return dataTransfer.files;
  }

  /**
   * Muestra un mensaje de error
   */
  private showError(message: string) {
    // Busca si ya existe un mensaje de error
    let errorMessage = this.querySelector('.message-error');

    if (!errorMessage) {
      errorMessage = document.createElement('div');
      errorMessage.className = 'message message-error';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.setAttribute('aria-live', 'assertive');
      this.appendChild(errorMessage);
    }

    errorMessage.textContent = message;

    // Elimina el mensaje después de 3 segundos
    setTimeout(() => {
      if (errorMessage && errorMessage.parentNode) {
        errorMessage.parentNode.removeChild(errorMessage);
      }
    }, 3000);
  }

  /**
   * Renderiza el componente
   */
  private render() {
    this.innerHTML = `
      <div 
        class="dropzone" 
        tabindex="0" 
        role="button" 
        aria-label="Zona para arrastrar y soltar imágenes" 
        aria-describedby="dropzone-instructions"
      >
        <input 
          type="file" 
          class="file-input" 
          accept="image/*" 
          multiple 
          aria-label="Seleccionar imágenes" 
        />
        <div class="dropzone-content">
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h2>Arrastra y suelta tus imágenes aquí</h2>
          <p id="dropzone-instructions">o haz clic para seleccionar archivos</p>
          <p class="dropzone-formats">Formatos soportados: PNG, JPEG, WEBP, GIF, BMP, TIFF, AVIF</p>
          <div class="dropzone-status sr-only" aria-live="polite"></div>
        </div>
      </div>
    `;
  }

  /**
   * Maneja el clic en cualquier parte de la zona de drop
   */
  private handleAreaClick(event: MouseEvent) {
    // Evitar activar el click si el target ya es el input
    if (event.target !== this.fileInput) {
      this.fileInput.click();
      this.updateStatus('Seleccionando archivos...');
    }
  }
}

// Registrar el componente
customElements.define('drop-zone', DropZone);
