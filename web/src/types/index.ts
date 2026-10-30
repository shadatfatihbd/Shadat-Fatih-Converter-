export type Language = 'en' | 'bn';
export type Theme = 'light' | 'dark';

export type ToolCategory =
  | 'all'
  | 'pdf'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'audio'
  | 'video'
  | 'archive'
  | 'qr-barcode'
  | 'text'
  | 'utility';

export interface ConversionTool {
  id: string;
  nameKey: string;
  descKey: string;
  category: ToolCategory;
  iconName: string;
  inputExtensions: string[];
  outputExtensions: string[];
  maxFileSizeMB: number;
  popular?: boolean;
  engine:
    | 'pdf'
    | 'image'
    | 'document'
    | 'spreadsheet'
    | 'presentation'
    | 'audio'
    | 'video'
    | 'archive'
    | 'utility'
    | 'ocr'
    | 'qr-barcode'
    | 'text';
  requiresBackend?: boolean;
}

export type ConversionStatus = 'idle' | 'validating' | 'processing' | 'success' | 'error';

export interface ConvertedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  blob: Blob;
  previewUrl?: string;
  extraInfo?: string;
  previewText?: string;
}

export interface ImageConversionSettings {
  targetFormat: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp' | 'image/x-icon' | 'image/svg+xml';
  quality: number; // 0.1 to 1.0
  resizeEnabled: boolean;
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio: boolean;
  rotation: number; // 0, 90, 180, 270
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  filter?: 'none' | 'grayscale' | 'sepia' | 'invert';
  backgroundColor?: string;
  watermarkText?: string;
  preset?: string;
  cropEnabled?: boolean;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export interface PdfConversionSettings {
  mergeOrder?: number[];
  splitPages?: string; // e.g. "1-3, 5"
  rotateAngle?: number;
  deletePages?: string;
  compressionQuality?: 'low' | 'medium' | 'high';
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkAngle?: number;
  pageNumberPosition?: 'bottom-center' | 'bottom-right' | 'top-right';
  targetImageFormat?: 'png' | 'jpeg' | 'webp' | 'bmp';
  scale?: number;
  metaTitle?: string;
  metaAuthor?: string;
  metaSubject?: string;
}

export interface SpreadsheetSettings {
  targetFormat: 'xlsx' | 'xls' | 'csv' | 'tsv' | 'json' | 'pdf' | 'html';
  selectedSheet?: string;
  delimiter?: string;
}

export interface DocumentSettings {
  targetFormat: 'docx' | 'pdf' | 'txt' | 'html';
}

export interface MediaSettings {
  audioTargetFormat?: 'wav' | 'mp3' | 'ogg' | 'flac' | 'aac' | 'm4a';
  videoTargetFormat?: 'gif' | 'frames' | 'mp3' | 'wav';
  trimStartSec?: number;
  trimEndSec?: number;
  videoQuality?: 'high' | 'medium' | 'low';
}

export interface ArchiveSettings {
  compressionLevel: 1 | 5 | 9; // fast, normal, max
}

export interface UtilitySettings {
  hashAlgorithm?: 'SHA-256' | 'SHA-1' | 'MD5';
}
