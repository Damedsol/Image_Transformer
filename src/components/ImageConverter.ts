import { ImageInfo, ConversionOptions, ConversionStatus } from '../types/image';
import { DropZoneElement, ConversionOptionsElement } from '../types/components';
import { prepareImageFile } from '../utils/fileUtils';
import { convertImagesAPI } from '../utils/api';
import { logApiError } from '../utils/logger';

/**
 * Main component for the image converter
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
   * Callback that executes when the component connects to the DOM
   */
  connectedCallback() {
    this.render();
    this.setupComponents();
    this.statusAnnouncer = document.getElementById('status-announcer');
    // Add accessibility roles
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Image converter');
  }

  /**
   * Sets up child components and their event listeners
   */
  private setupComponents() {
    // DropZone component
    const dropZone = this.querySelector('drop-zone') as DropZoneElement;
    if (dropZone) {
      dropZone.setOnFilesSelectedCallback(this.handleFilesSelected.bind(this));
    }

    // ConversionOptions component
    const conversionOptions = this.querySelector('conversion-options') as ConversionOptionsElement;
    if (conversionOptions) {
      conversionOptions.setOnChangeCallback(this.handleOptionsChange.bind(this));
    }

    // Convert button
    const convertButton = this.querySelector('#convert-button');
    if (convertButton) {
      convertButton.addEventListener('click', this.handleConvertClick.bind(this));
      // Accessibility improvement: add roles and ARIA attributes
      convertButton.setAttribute('aria-live', 'polite');
    }

    // Handle keyboard navigation for the preview area
    this.handleKeyboardNavigation();
  }

  /**
   * Sets up keyboard navigation to improve accessibility
   */
  private handleKeyboardNavigation() {
    // Allow user to navigate between previews with keyboard
    this.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target.classList.contains('preview-item')) {
          e.preventDefault();
          // Emulate a click on the remove button if present
          const removeBtn = target.querySelector('.remove-image-btn');
          if (removeBtn) {
            (removeBtn as HTMLElement).click();
          }
        }
      }
    });
  }

  /**
   * Announces messages for screen readers
   */
  private announceStatus(message: string) {
    if (this.statusAnnouncer) {
      this.statusAnnouncer.textContent = message;
    }
  }

  /**
   * Handles file selection from the DropZone
   */
  private async handleFilesSelected(files: FileList) {
    try {
      // Announce status for screen readers
      this.announceStatus('Processing images, please wait...');

      // Change status to processing
      this.updateStatus('processing');

      // Prepare each file
      const promises = Array.from(files).map(async file => {
        try {
          const imageInfo = await prepareImageFile(file);
          this.images.push(imageInfo);
          return imageInfo;
        } catch (error) {
          logApiError('processFile', error);
          this.showMessage(`Error processing file ${file.name}`, 'error');
          return null;
        }
      });

      // Wait for all files to be processed
      const results = await Promise.all(promises);
      const validImages = results.filter(Boolean) as ImageInfo[];

      // Update previews
      this.updatePreviews();

      // Announce for screen readers
      if (validImages.length > 0) {
        this.announceStatus(
          `${validImages.length} image${validImages.length > 1 ? 's' : ''} loaded successfully. You can now convert them.`
        );
      }

      // Show success message
      if (validImages.length > 0) {
        this.showMessage(
          `${validImages.length} image${validImages.length > 1 ? 's' : ''} loaded successfully`,
          'success'
        );
      }

      // Update status
      this.updateStatus('idle');
    } catch (error) {
      logApiError('selectFiles', error);
      this.showMessage('Error selecting files', 'error');
      this.updateStatus('error');
      this.announceStatus('Error loading images. Please try again.');
    }
  }

  /**
   * Handles changes in conversion options
   */
  private handleOptionsChange(options: ConversionOptions) {
    this.options = options;

    // Update conversion options for all images
    this.images = this.images.map(img => ({
      ...img,
      conversionOptions: {
        ...img.conversionOptions,
        ...options,
      },
    }));

    // Announce changes for screen readers
    this.announceStatus(
      `Conversion options updated: format ${options.format}, quality ${options.quality}%`
    );
  }

  /**
   * Handles the convert button click
   */
  private async handleConvertClick() {
    if (this.images.length === 0) {
      this.showMessage('Please select at least one image to convert', 'error');
      this.announceStatus('Error: No images selected for conversion');
      return;
    }

    if (this.status === 'processing') {
      return;
    }

    try {
      // Announce status for screen readers
      this.announceStatus('Starting image conversion, please wait...');

      // Change status to processing
      this.updateStatus('processing');

      // Update UI to show we're processing
      const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;
      if (convertButton) {
        convertButton.disabled = true;
        convertButton.setAttribute('aria-busy', 'true');
        convertButton.innerHTML = `
          <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
          Converting...
        `;
      }

      // Call API to convert images
      const zipUrl = await convertImagesAPI(this.images, this.options);

      // Update status
      this.updateStatus('success');

      // Announce for screen readers
      this.announceStatus(
        `${this.images.length} image${this.images.length > 1 ? 's' : ''} converted successfully. ZIP file is available for download.`
      );

      // Show success message
      this.showMessage(
        `${this.images.length} image${this.images.length > 1 ? 's' : ''} converted successfully`,
        'success'
      );

      // Show ZIP download link
      this.createDownloadLink(zipUrl);

      // Restore button
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.setAttribute('aria-busy', 'false');
        convertButton.innerHTML = 'Convert images';
      }
    } catch (error) {
      logApiError('convertImages', error);
      this.showMessage('Error converting images', 'error');
      this.announceStatus('Error during image conversion.');
      this.updateStatus('error');

      // Restore button
      const convertButton = this.querySelector('#convert-button') as HTMLButtonElement;
      if (convertButton) {
        convertButton.disabled = false;
        convertButton.setAttribute('aria-busy', 'false');
        convertButton.innerHTML = 'Convert images';
      }
    }
  }

  /**
   * Creates a link to download the ZIP file
   */
  private createDownloadLink(zipUrl: string) {
    // Create a container for the download link
    const downloadsContainer = document.createElement('div');
    downloadsContainer.className = 'downloads-container';
    downloadsContainer.setAttribute('role', 'region');
    downloadsContainer.setAttribute('aria-label', 'Download links');

    downloadsContainer.innerHTML = `
        <h3 id="download-heading">Available downloads</h3>
        <ul class="downloads-list" aria-labelledby="download-heading">
            <li>
                <a href="${zipUrl}" class="download-link" target="_blank" aria-label="Download all converted images in ZIP format">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download all images (ZIP)
                </a>
            </li>
        </ul>
    `;

    // Check if a downloads container already exists
    const existingContainer = this.querySelector('.downloads-container');
    if (existingContainer) {
      existingContainer.replaceWith(downloadsContainer);
    } else {
      // Insert the container in the content-actions
      const actionsContainer = this.querySelector('.action-container');
      if (actionsContainer) {
        actionsContainer.insertBefore(downloadsContainer, actionsContainer.firstChild);
      }
    }
  }

  /**
   * Updates image previews
   */
  private updatePreviews() {
    const previewArea = this.querySelector('.preview-area');
    if (!previewArea) return;

    // Add accessibility attributes to the preview area
    previewArea.setAttribute('role', 'list');
    previewArea.setAttribute('aria-label', 'Image previews');

    // Clear the preview area
    previewArea.innerHTML = '';

    // If no images, show a message
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
        <p>No images selected</p>
      `;
      previewArea.appendChild(noImagesElement);
      return;
    }

    // Add previews for each image
    this.images.forEach((image, index) => {
      const previewItem = document.createElement('div');
      previewItem.className = 'preview-item';
      previewItem.setAttribute('role', 'listitem');
      previewItem.setAttribute('tabindex', '0');
      previewItem.setAttribute('aria-label', `Image ${index + 1}: ${image.name}`);

      // Create preview content
      previewItem.innerHTML = `
        <img src="${image.preview}" alt="${image.name}" loading="lazy" />
        <div class="preview-info">
          <div class="preview-name">${image.name}</div>
          <div class="preview-meta">${(image.size / 1024).toFixed(2)} KB</div>
        </div>
        <button class="remove-image-btn" data-id="${image.id}" aria-label="Remove image ${image.name}">
          <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      // Add event listener to remove image
      const removeBtn = previewItem.querySelector('.remove-image-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', e => {
          e.stopPropagation();
          this.handleRemoveImage(image.id);
        });
      }

      previewArea.appendChild(previewItem);
    });
  }

  /**
   * Handles image removal
   */
  private handleRemoveImage(id: string) {
    // Find the image to remove
    const imageToRemove = this.images.find(img => img.id === id);
    const imageName = imageToRemove?.name || 'Image';

    // Filter images to remove the selected one
    this.images = this.images.filter(img => img.id !== id);

    // Update previews
    this.updatePreviews();

    // Show message
    this.showMessage(`Image ${imageName} removed`, 'success');

    // Announce for screen readers
    this.announceStatus(`Image ${imageName} removed. ${this.images.length} images remaining.`);
  }

  /**
   * Updates the converter status
   */
  private updateStatus(status: ConversionStatus) {
    this.status = status;
    const convertContainer = this.querySelector('.converter-container');

    if (convertContainer) {
      // Remove previous status classes
      convertContainer.classList.remove(
        'status-idle',
        'status-processing',
        'status-success',
        'status-error'
      );

      // Add new status class
      convertContainer.classList.add(`status-${status}`);

      // Update ARIA attribute to announce status
      convertContainer.setAttribute('aria-busy', status === 'processing' ? 'true' : 'false');
    }
  }

  /**
   * Shows an informative message
   */
  private showMessage(text: string, type: 'error' | 'success') {
    // Check if a message already exists
    let messageElement = this.querySelector('.message');

    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.className = 'message';
      messageElement.setAttribute('role', 'alert');
      messageElement.setAttribute('aria-live', 'assertive');
      this.appendChild(messageElement);
    }

    // Update message class and content
    messageElement.className = `message message-${type}`;
    messageElement.textContent = text;

    // Remove message after some time
    setTimeout(() => {
      if (messageElement && messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 5000);
  }

  /**
   * Renders the component
   */
  private render() {
    this.innerHTML = `
      <div class="app-container">
        <header class="header">
          <h1>Image Converter</h1>
          <p>Convert your images to different formats in seconds</p>
        </header>
        
        <div class="converter-container" role="application">
          <section class="upload-section">
            <h2 id="upload-heading" class="sr-only">Upload images</h2>
            <drop-zone aria-labelledby="upload-heading"></drop-zone>
          </section>
          
          <section class="preview-section">
            <h2 id="preview-heading">Selected images</h2>
            <div class="preview-area" aria-labelledby="preview-heading"></div>
          </section>
          
          <section class="options-section" aria-labelledby="options-component">
            <conversion-options id="options-component"></conversion-options>
          </section>
          
          <div class="action-container">
            <button id="convert-button" class="btn btn-primary convert-btn" aria-describedby="convert-description">
              Convert images
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

// Register the component
customElements.define('image-converter', ImageConverter);
