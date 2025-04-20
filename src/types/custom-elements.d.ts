import { DropZoneElement, ImagePreviewElement, ConversionOptionsElement } from './components';

/**
 * Declaraciones para elementos personalizados
 */
declare global {
  interface HTMLElementTagNameMap {
    'drop-zone': DropZoneElement;
    'image-preview': ImagePreviewElement;
    'conversion-options': ConversionOptionsElement;
  }
}
