import { ConvertedFile } from '../types';

export interface TextStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
  readingTimeMin: number;
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).length : 0;
  const readingTimeMin = Math.ceil(words / 200);

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    paragraphs,
    readingTimeMin
  };
}

export function convertCase(
  text: string,
  mode: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'snake' | 'kebab' | 'constant'
): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
    case 'camel':
      return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase());
    case 'snake':
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    case 'kebab':
      return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    case 'constant':
      return text
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '');
    default:
      return text;
  }
}

export function reverseText(text: string, mode: 'chars' | 'words' | 'lines'): string {
  if (mode === 'lines') {
    return text.split(/\r?\n/).reverse().join('\n');
  }
  if (mode === 'words') {
    return text.split(/\s+/).reverse().join(' ');
  }
  return text.split('').reverse().join('');
}

export function cleanText(text: string, removeExtraSpaces: boolean, removeDuplicates: boolean): string {
  let cleaned = text;

  if (removeExtraSpaces) {
    cleaned = cleaned
      .split(/\r?\n/)
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');
  }

  if (removeDuplicates) {
    const lines = cleaned.split(/\r?\n/);
    const unique = Array.from(new Set(lines));
    cleaned = unique.join('\n');
  }

  return cleaned;
}

export function formatAndValidateJson(jsonStr: string, mode: 'pretty' | 'minify'): {
  isValid: boolean;
  result: string;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    const result = mode === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    return { isValid: true, result };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Invalid JSON Syntax';
    return { isValid: false, result: jsonStr, error: errorMsg };
  }
}

export async function imageToBase64(file: File): Promise<ConvertedFile> {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const report = [
    `--- Image to Base64 (Data URI) ---`,
    `File Name: ${file.name}`,
    `Size: ${file.size} bytes`,
    `MIME Type: ${file.type}`,
    `----------------------------------`,
    base64Data
  ].join('\n');

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  return {
    name: `${baseName}_base64.txt`,
    size: blob.size,
    type: 'text/plain',
    url,
    blob,
    previewText: base64Data.slice(0, 1000) + '...',
    extraInfo: `Generated Base64 Data URI (${base64Data.length.toLocaleString()} characters)`
  };
}

export async function base64ToImage(base64Input: string): Promise<ConvertedFile> {
  const cleanInput = base64Input.trim();
  const dataUri = cleanInput.startsWith('data:')
    ? cleanInput
    : `data:image/png;base64,${cleanInput}`;

  const res = await fetch(dataUri);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const ext = blob.type.split('/')[1] || 'png';

  return {
    name: `decoded_image_${Date.now()}.${ext}`,
    size: blob.size,
    type: blob.type,
    url,
    blob,
    previewUrl: url,
    extraInfo: `Decoded ${blob.type} image (${(blob.size / 1024).toFixed(1)} KB)`
  };
}
