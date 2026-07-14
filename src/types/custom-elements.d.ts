import type {
	DropZoneElement,
	ImagePreviewElement,
	ConversionOptionsElement,
} from "./components";

declare global {
	interface HTMLElementTagNameMap {
		"drop-zone": DropZoneElement;
		"image-preview": ImagePreviewElement;
		"conversion-options": ConversionOptionsElement;
		"image-converter": typeof import("../components/ImageConverter").ImageConverter;
		"tn-icon": typeof import("../components/TnIcon").TnIcon;
	}
}
