import { ConversionOptions as Options, ImageFormat } from '../types/image';

/**
 * Component for image conversion options
 */
export class ConversionOptions extends HTMLElement {
  private options: Options;
  private onChange: (options: Options) => void;

  constructor() {
    super();
    this.onChange = () => {};
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
    this.setupEventListeners();
    this.ensureAccessibility();
  }

  /**
   * Setter for conversion options
   */
  set conversionOptions(options: Options) {
    this.options = { ...this.options, ...options };
    this.updateFormValues();
  }

  /**
   * Getter for conversion options
   */
  get conversionOptions(): Options {
    return this.options;
  }

  /**
   * Registers the callback for when options change
   */
  public setOnChangeCallback(callback: (options: Options) => void) {
    this.onChange = callback;
  }

  /**
   * Updates form values according to current options
   */
  private updateFormValues() {
    const formatSelect = this.querySelector('#format') as HTMLSelectElement;
    const qualityInput = this.querySelector('#quality') as HTMLInputElement;
    const qualityValue = this.querySelector('#quality-value') as HTMLElement;
    const maintainAspectRatio = this.querySelector('#maintain-aspect-ratio') as HTMLInputElement;
    const widthInput = this.querySelector('#width') as HTMLInputElement;
    const heightInput = this.querySelector('#height') as HTMLInputElement;

    if (formatSelect) {
      formatSelect.value = this.options.format;
    }

    if (qualityInput && qualityValue) {
      qualityInput.value = String(this.options.quality || 90);
      qualityValue.textContent = String(this.options.quality || 90);
    }

    if (maintainAspectRatio) {
      maintainAspectRatio.checked = this.options.maintainAspectRatio ?? true;
    }

    if (widthInput && this.options.width) {
      widthInput.value = String(this.options.width);
    }

    if (heightInput && this.options.height) {
      heightInput.value = String(this.options.height);
    }
  }

  /**
   * Sets up event listeners for option changes
   */
  private setupEventListeners() {
    // Format select
    const formatSelect = this.querySelector('#format') as HTMLSelectElement;
    if (formatSelect) {
      formatSelect.addEventListener('change', () => {
        this.options.format = formatSelect.value as ImageFormat;
        this.onChange(this.options);
      });
    }

    // Quality slider
    const qualityInput = this.querySelector('#quality') as HTMLInputElement;
    const qualityValue = this.querySelector('#quality-value') as HTMLElement;
    if (qualityInput && qualityValue) {
      qualityInput.addEventListener('input', () => {
        this.options.quality = parseInt(qualityInput.value, 10);
        qualityValue.textContent = qualityInput.value;
        this.onChange(this.options);
      });
    }

    // Maintain aspect ratio
    const maintainAspectRatio = this.querySelector('#maintain-aspect-ratio') as HTMLInputElement;
    if (maintainAspectRatio) {
      maintainAspectRatio.addEventListener('change', () => {
        this.options.maintainAspectRatio = maintainAspectRatio.checked;
        this.onChange(this.options);
      });
    }

    // Width input
    const widthInput = this.querySelector('#width') as HTMLInputElement;
    if (widthInput) {
      widthInput.addEventListener('input', () => {
        this.options.width = widthInput.value ? parseInt(widthInput.value, 10) : undefined;
        this.onChange(this.options);
      });
    }

    // Height input
    const heightInput = this.querySelector('#height') as HTMLInputElement;
    if (heightInput) {
      heightInput.addEventListener('input', () => {
        this.options.height = heightInput.value ? parseInt(heightInput.value, 10) : undefined;
        this.onChange(this.options);
      });
    }
  }

  /**
   * Renders the component
   */
  private render() {
    this.innerHTML = `
      <div class="options-container" role="region" aria-label="Conversion options">
        <h2 id="options-heading">Conversion options</h2>
        
        <div class="form-group">
          <label for="format" class="form-label">Output format</label>
          <select id="format" class="form-select" aria-label="Select output format">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WEBP</option>
            <option value="gif">GIF</option>
            <option value="bmp">BMP</option>
            <option value="tiff">TIFF</option>
            <option value="avif">AVIF</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="quality" class="form-label" id="quality-label">Quality: <span id="quality-value">90</span>%</label>
          <input 
            type="range" 
            id="quality" 
            class="form-range" 
            min="10" 
            max="100" 
            step="1" 
            value="90"
            aria-labelledby="quality-label"
            aria-label="Image quality, adjustable from 10 to 100 percent"
          />
        </div>
        
        <div class="form-group">
          <fieldset>
            <legend>Dimensions (optional)</legend>
            
            <div class="dimensions-wrapper">
              <div class="dimensions-container">
                <div class="form-group">
                  <label for="width" class="form-label">Width (px)</label>
                  <input 
                    type="number" 
                    id="width" 
                    class="form-input" 
                    placeholder="Auto" 
                    min="1"
                    aria-label="Width in pixels" 
                  />
                </div>
                
                <div class="form-group">
                  <label for="height" class="form-label">Height (px)</label>
                  <input 
                    type="number" 
                    id="height" 
                    class="form-input" 
                    placeholder="Auto" 
                    min="1"
                    aria-label="Height in pixels" 
                  />
                </div>
              </div>
              
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="maintain-aspect-ratio" 
                  class="form-check-input" 
                  checked
                  aria-label="Maintain aspect ratio" 
                />
                <label for="maintain-aspect-ratio" class="form-check-label">
                  Maintain aspect ratio
                </label>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    `;
  }

  /**
   * Verifies and corrects accessibility issues
   */
  private ensureAccessibility() {
    // Ensure the label has the correct ID for aria-labelledby
    const qualityLabel = this.querySelector('label[for="quality"]');
    if (qualityLabel && !qualityLabel.id) {
      qualityLabel.id = 'quality-label';
    }

    // Ensure the input has correct references
    const qualityInput = this.querySelector('#quality') as HTMLInputElement;
    if (qualityInput) {
      if (qualityLabel && qualityLabel.id) {
        qualityInput.setAttribute('aria-labelledby', qualityLabel.id);
      }

      // Add aria-label as backup
      if (!qualityInput.hasAttribute('aria-label')) {
        qualityInput.setAttribute('aria-label', 'Image quality, adjustable from 10 to 100 percent');
      }
    }
  }
}

// Register the component
customElements.define('conversion-options', ConversionOptions);
