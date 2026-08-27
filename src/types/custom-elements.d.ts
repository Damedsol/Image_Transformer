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
		"image-converter": import("../components/ImageConverter").ImageConverter;
		"tn-icon": import("../components/TnIcon").TnIcon;
	}
}
