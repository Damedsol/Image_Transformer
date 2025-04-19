import { ImageInfo, ConversionOptions } from './image';

/**
 * Interfaz para el componente DropZone
 */
export interface DropZoneElement extends HTMLElement {
  setOnFilesSelectedCallback: (callback: (files: FileList) => void) => void;
}

/**
 * Interfaz para el componente ImagePreview
 */
export interface ImagePreviewElement extends HTMLElement {
  image: ImageInfo;
  setOnRemoveCallback: (callback: (id: string) => void) => void;
}

/**
 * Interfaz para el componente ConversionOptions
 */
export interface ConversionOptionsElement extends HTMLElement {
  conversionOptions: ConversionOptions;
  setOnChangeCallback: (callback: (options: ConversionOptions) => void) => void;
}
