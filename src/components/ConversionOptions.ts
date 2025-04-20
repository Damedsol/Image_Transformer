import { ConversionOptions as Options, ImageFormat } from '../types/image';

/**
 * Componente para las opciones de conversión de imágenes
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
   * Callback que se ejecuta cuando el componente se conecta al DOM
   */
  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Setter para las opciones de conversión
   */
  set conversionOptions(options: Options) {
    this.options = { ...this.options, ...options };
    this.updateFormValues();
  }

  /**
   * Getter para las opciones de conversión
   */
  get conversionOptions(): Options {
    return this.options;
  }

  /**
   * Registra el callback para cuando cambian las opciones
   */
  public setOnChangeCallback(callback: (options: Options) => void) {
    this.onChange = callback;
  }

  /**
   * Actualiza los valores del formulario según las opciones actuales
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
   * Configura los event listeners para los cambios en las opciones
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
   * Renderiza el componente
   */
  private render() {
    this.innerHTML = `
      <div class="options-container" role="region" aria-label="Opciones de conversión">
        <h2 id="options-heading">Opciones de conversión</h2>
        
        <div class="form-group">
          <label for="format" class="form-label">Formato de salida</label>
          <select id="format" class="form-select" aria-label="Seleccionar formato de salida">
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
          <label for="quality" class="form-label" id="quality-label">Calidad: <span id="quality-value">90</span>%</label>
          <input 
            type="range" 
            id="quality" 
            class="form-range" 
            min="10" 
            max="100" 
            step="1" 
            value="90"
            aria-labelledby="quality-label" 
          />
        </div>
        
        <div class="form-group">
          <fieldset>
            <legend>Dimensiones (opcional)</legend>
            
            <div class="dimensions-wrapper">
              <div class="dimensions-container">
                <div class="form-group">
                  <label for="width" class="form-label">Ancho (px)</label>
                  <input 
                    type="number" 
                    id="width" 
                    class="form-input" 
                    placeholder="Auto" 
                    min="1"
                    aria-label="Ancho en píxeles" 
                  />
                </div>
                
                <div class="form-group">
                  <label for="height" class="form-label">Alto (px)</label>
                  <input 
                    type="number" 
                    id="height" 
                    class="form-input" 
                    placeholder="Auto" 
                    min="1"
                    aria-label="Alto en píxeles" 
                  />
                </div>
              </div>
              
              <div class="form-check">
                <input 
                  type="checkbox" 
                  id="maintain-aspect-ratio" 
                  class="form-check-input" 
                  checked
                  aria-label="Mantener proporción de aspecto" 
                />
                <label for="maintain-aspect-ratio" class="form-check-label">
                  Mantener proporción de aspecto
                </label>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    `;
  }
}

// Registrar el componente
customElements.define('conversion-options', ConversionOptions);
