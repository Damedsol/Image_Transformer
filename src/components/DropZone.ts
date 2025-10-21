import { isValidImage } from '../utils/fileUtils';

/**
 * DropZone component for loading images via drag and drop or click
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
   * Callback that executes when the component connects to the DOM
   */
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for drag and drop and file selection
   */
  private setupEventListeners() {
    this.dropArea = this.querySelector('.dropzone') as HTMLElement;
    this.fileInput = this.querySelector('.file-input') as HTMLInputElement;
    this.statusElement = this.querySelector('.dropzone-status') as HTMLElement;

    // Drag and drop events
    this.dropArea.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropArea.addEventListener('drop', this.handleDrop.bind(this));

    // File selection event through input
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

    // Handle click on the entire area to open file selector
    this.dropArea.addEventListener('click', this.handleAreaClick.bind(this));

    // Prevent clicks on internal content from opening the selector multiple times
    const dropzoneContent = this.querySelector('.dropzone-content');
    if (dropzoneContent) {
      dropzoneContent.addEventListener('click', _e => {
        // Don't stop propagation so the click reaches the dropArea
        // We just prevent the event from firing multiple times
      });
    }

    // Improve keyboard accessibility
    this.dropArea.addEventListener('keydown', e => {
      // Activate file input when pressing Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.fileInput.click();
        // Announce for screen readers
        this.updateStatus('Selecting files...');
      }
    });

    // Add focus feedback
    this.dropArea.addEventListener('focus', () => {
      this.dropArea.classList.add('focus-visible');
    });

    this.dropArea.addEventListener('blur', () => {
      this.dropArea.classList.remove('focus-visible');
    });
  }

  /**
   * Updates status for screen readers
   */
  private updateStatus(message: string) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  /**
   * Registers the callback for when files are selected
   */
  public setOnFilesSelectedCallback(callback: (files: FileList) => void) {
    this.onFilesSelected = callback;
  }

  /**
   * Handles the dragover event
   */
  private handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.add('drag-active');
    this.updateStatus('Drop to load images');

    // Update cursor to indicate it can be dropped
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  /**
   * Handles the dragleave event
   */
  private handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.remove('drag-active');
    this.updateStatus('');
  }

  /**
   * Handles the drop event
   */
  private handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropArea.classList.remove('drag-active');
    this.updateStatus('Processing dropped files...');

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const files = this.filterImageFiles(event.dataTransfer.files);
      if (files.length > 0) {
        this.updateStatus(`${files.length} images loaded successfully`);
        this.onFilesSelected(files);
      } else {
        this.updateStatus('No valid images loaded');
        this.showError('Only image files are allowed');
      }
    }
  }

  /**
   * Handles file selection from the input
   */
  private handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.updateStatus('Processing selected files...');

    if (input.files && input.files.length > 0) {
      const files = this.filterImageFiles(input.files);

      if (files.length > 0) {
        this.updateStatus(`${files.length} images loaded successfully`);
        this.onFilesSelected(files);
      } else {
        this.updateStatus('No valid images loaded');
        this.showError('Only image files are allowed');
      }
    }

    // Reset input to allow selecting the same file again
    input.value = '';
  }

  /**
   * Filters files that are not images
   */
  private filterImageFiles(fileList: FileList): FileList {
    const validFiles: File[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (isValidImage(file)) {
        validFiles.push(file);
      }
    }

    // Create a new FileList object (we use a trick since FileList is immutable)
    const dataTransfer = new DataTransfer();
    validFiles.forEach(file => dataTransfer.items.add(file));

    return dataTransfer.files;
  }

  /**
   * Shows an error message
   */
  private showError(message: string) {
    // Check if an error message already exists
    let errorMessage = this.querySelector('.message-error');

    if (!errorMessage) {
      errorMessage = document.createElement('div');
      errorMessage.className = 'message message-error';
      errorMessage.setAttribute('role', 'alert');
      errorMessage.setAttribute('aria-live', 'assertive');
      this.appendChild(errorMessage);
    }

    errorMessage.textContent = message;

    // Remove message after 3 seconds
    setTimeout(() => {
      if (errorMessage && errorMessage.parentNode) {
        errorMessage.parentNode.removeChild(errorMessage);
      }
    }, 3000);
  }

  /**
   * Renders the component
   */
  private render() {
    this.innerHTML = `
      <div 
        class="dropzone" 
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
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h2>Drag and drop your images here</h2>
          <p id="dropzone-instructions">or click to select files</p>
          <p class="dropzone-formats">Supported formats: PNG, JPEG, WEBP, GIF, BMP, TIFF, AVIF</p>
          <div class="dropzone-status sr-only" aria-live="polite"></div>
        </div>
      </div>
    `;
  }

  /**
   * Handles click anywhere in the drop area
   */
  private handleAreaClick(event: MouseEvent) {
    // Avoid activating the click if the target is already the input
    if (event.target !== this.fileInput) {
      this.fileInput.click();
      this.updateStatus('Selecting files...');
    }
  }
}

// Register the component
customElements.define('drop-zone', DropZone);
