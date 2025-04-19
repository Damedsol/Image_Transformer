import { isValidImage } from '../utils/fileUtils';

/**
 * Componente DropZone para cargar imágenes mediante drag and drop o clic
 */
export class DropZone extends HTMLElement {
  private dropArea: HTMLElement;
  private fileInput: HTMLInputElement;
  private onFilesSelected: (files: FileList) => void;

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

    // Eventos de drag and drop
    this.dropArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropArea.addEventListener('drop', this.handleDrop.bind(this));

    // Evento de selección de archivos a través del input
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
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
  }

  /**
   * Maneja el evento drop
   */
  private handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.remove('drag-active');

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = this.filterImageFiles(event.dataTransfer.files);
      if (files.length > 0) {
        this.onFilesSelected(files);
      } else {
        this.showError('Solo se permiten archivos de imagen');
      }
    }
  }

  /**
   * Maneja la selección de archivos desde el input
   */
  private handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = this.filterImageFiles(input.files);

      if (files.length > 0) {
        this.onFilesSelected(files);
      } else {
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
    validFiles.forEach((file) => dataTransfer.items.add(file));

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
      <div class="dropzone" tabindex="0" role="button" aria-label="Zona para arrastrar y soltar imágenes">
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
          <p>o haz clic para seleccionar archivos</p>
          <p class="dropzone-formats">Formatos soportados: PNG, JPEG, WEBP, GIF, BMP, TIFF, AVIF</p>
        </div>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define('drop-zone', DropZone);
