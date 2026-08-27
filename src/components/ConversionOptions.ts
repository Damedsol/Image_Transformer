import { ConversionOptions as Options, ImageFormat } from "../types/image";
import "./TnIcon";

/**
 * ConversionOptions component (SNA-02 Inputs + SNA-20 Select + SNA-27 Slider + SNA-18 Checkbox)
 */
export class ConversionOptions extends HTMLElement {
	private options: Options;
	private onChange: (options: Options) => void;

	constructor() {
		super();
		this.onChange = () => {};
		this.options = {
			format: "png",
			quality: 90,
			maintainAspectRatio: true,
		};
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
		this.ensureAccessibility();
	}

	set conversionOptions(options: Options) {
		this.options = { ...this.options, ...options };
		this.updateFormValues();
	}

	get conversionOptions(): Options {
		return this.options;
	}

	public setOnChangeCallback(callback: (options: Options) => void) {
		this.onChange = callback;
	}

	private updateFormValues() {
		const formatSelect = this.querySelector("#format") as HTMLSelectElement;
		const qualityInput = this.querySelector("#quality") as HTMLInputElement;
		const qualityValue = this.querySelector("#quality-value") as HTMLElement;
		const maintainAspectRatio = this.querySelector(
			"#maintain-aspect-ratio",
		) as HTMLInputElement;
		const widthInput = this.querySelector("#width") as HTMLInputElement;
		const heightInput = this.querySelector("#height") as HTMLInputElement;

		if (formatSelect) formatSelect.value = this.options.format;
		if (qualityInput && qualityValue) {
			const quality = String(this.options.quality || 90);
			qualityInput.value = quality;
			qualityInput.setAttribute("aria-valuenow", quality);
			qualityValue.textContent = quality;
		}
		if (maintainAspectRatio)
			maintainAspectRatio.checked = this.options.maintainAspectRatio ?? true;
		if (widthInput && this.options.width)
			widthInput.value = String(this.options.width);
		if (heightInput && this.options.height)
			heightInput.value = String(this.options.height);
	}

	private setupEventListeners() {
		const formatSelect = this.querySelector("#format") as HTMLSelectElement;
		if (formatSelect) {
			formatSelect.addEventListener("change", () => {
				this.options.format = formatSelect.value as ImageFormat;
				this.onChange(this.options);
			});
		}

		const qualityInput = this.querySelector("#quality") as HTMLInputElement;
		const qualityValue = this.querySelector("#quality-value") as HTMLElement;
		if (qualityInput && qualityValue) {
			qualityInput.addEventListener("input", () => {
				this.options.quality = parseInt(qualityInput.value, 10);
				qualityInput.setAttribute("aria-valuenow", qualityInput.value);
				qualityValue.textContent = qualityInput.value;
				this.onChange(this.options);
			});
		}

		const maintainAspectRatio = this.querySelector(
			"#maintain-aspect-ratio",
		) as HTMLInputElement;
		if (maintainAspectRatio) {
			maintainAspectRatio.addEventListener("change", () => {
				this.options.maintainAspectRatio = maintainAspectRatio.checked;
				this.onChange(this.options);
			});
		}

		const widthInput = this.querySelector("#width") as HTMLInputElement;
		if (widthInput) {
			widthInput.addEventListener("input", () => {
				this.validateDimension(widthInput, "width", "Width");
			});
		}

		const heightInput = this.querySelector("#height") as HTMLInputElement;
		if (heightInput) {
			heightInput.addEventListener("input", () => {
				this.validateDimension(heightInput, "height", "Height");
			});
		}
	}

	private validateDimension(
		input: HTMLInputElement,
		key: "width" | "height",
		label: string,
	) {
		const errorId = `${key}-error`;
		const rawValue = input.value.trim();
		const num = rawValue === "" ? undefined : parseInt(rawValue, 10);
		const isValid =
			num === undefined || (Number.isInteger(num) && num >= 1 && num <= 10000);

		input.setAttribute("aria-invalid", String(!isValid));
		this.options[key] = isValid ? num : undefined;

		const existingError = this.querySelector(`#${errorId}`);
		if (isValid) {
			existingError?.remove();
		} else if (!existingError) {
			const error = document.createElement("span");
			error.id = errorId;
			error.className = "input-error";
			error.setAttribute("role", "alert");
			error.textContent = `${label} must be a whole number between 1 and 10000`;
			input.insertAdjacentElement("afterend", error);
		}
		this.onChange(this.options);
	}

	private render() {
		this.innerHTML = `
      <div class="options-container" role="region" aria-label="Conversion options">
        <h2>Conversion options</h2>

        <div class="form-group">
          <label for="format" class="form-label">Output format</label>
          <select id="format" class="form-select" aria-label="Select output format">
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WEBP</option>
            <option value="gif">GIF</option>
            <option value="avif">AVIF</option>
          </select>
        </div>

        <div class="form-group">
          <label for="quality" class="form-label" id="quality-label">Quality: <span id="quality-value">90</span>%</label>
          <input
            type="range"
            id="quality"
            min="10"
            max="100"
            step="1"
            value="90"
            aria-labelledby="quality-label"
            aria-valuemin="10"
            aria-valuemax="100"
            aria-valuenow="90"
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
                    class="input-field"
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
                    class="input-field"
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

	private ensureAccessibility() {
		const qualityLabel = this.querySelector('label[for="quality"]');
		if (qualityLabel && !qualityLabel.id) {
			qualityLabel.id = "quality-label";
		}
		const qualityInput = this.querySelector("#quality") as HTMLInputElement;
		if (qualityInput) {
			if (qualityLabel && qualityLabel.id) {
				qualityInput.setAttribute("aria-labelledby", qualityLabel.id);
			}
			if (!qualityInput.hasAttribute("aria-label")) {
				qualityInput.setAttribute(
					"aria-label",
					"Image quality, adjustable from 10 to 100 percent",
				);
			}
		}
	}
}

customElements.define("conversion-options", ConversionOptions);
