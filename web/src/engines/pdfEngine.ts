import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import { ConvertedFile } from '../types';

// Configure pdfjs worker CDN matching the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

// Browser canvas limits (iOS Safari ~16.7MP, Chrome/Firefox ~268MP, max side 16384/32767).
const MAX_CANVAS_SIDE = 16384;
const MAX_CANVAS_PIXELS = 16_777_216 * 4; // ~67MP desktop-safe
const MAX_CANVAS_PIXELS_MOBILE = 16_777_216; // ~16.7MP iOS Safari limit

function getSafeViewport(page: any, requestedScale: number) {
  const base = page.getViewport({ scale: 1 });
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const maxPixels = isMobile ? MAX_CANVAS_PIXELS_MOBILE : MAX_CANVAS_PIXELS;
  let scale = requestedScale;
  const sideLimit = MAX_CANVAS_SIDE / Math.max(base.width, base.height);
  const areaLimit = Math.sqrt(maxPixels / (base.width * base.height));
  scale = Math.max(0.5, Math.min(scale, sideLimit, areaLimit));
  return page.getViewport({ scale });
}

function createRenderCanvas(viewport: any, opaque: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: !opaque })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (opaque) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return { canvas, ctx };
}

export async function convertPdfToImages(
  file: File,
  format: 'png' | 'jpeg' | 'webp' | 'bmp' = 'png',
  scale: number = 300 / 72,
  onProgress?: (progress: number) => void
): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(10);

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('PDF has no renderable pages.');
  }

  const mimeType =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : format;

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // If single page, directly output the image
  if (numPages === 1) {
    const page = await pdfDoc.getPage(1);
    const viewport = getSafeViewport(page, scale);
    const { canvas, ctx } = createRenderCanvas(viewport, format !== 'png' && format !== 'webp');

    await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
    onProgress?.(80);

    const blob = await canvasToBlob(canvas, mimeType, format === 'bmp');
    const url = URL.createObjectURL(blob);
    onProgress?.(100);

    return {
      name: `${baseName}_page_1.${ext}`,
      size: blob.size,
      type: mimeType,
      url,
      blob,
      previewUrl: url,
      extraInfo: `${canvas.width}×${canvas.height}px • Page 1 of 1`
    };
  }

  // Multi-page PDF: render each page and bundle into a ZIP archive
  const zip = new JSZip();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = getSafeViewport(page, scale);
    const { canvas, ctx } = createRenderCanvas(viewport, format !== 'png' && format !== 'webp');

    await page.render({ canvasContext: ctx, viewport, intent: 'print' }).promise;
    const blob = await canvasToBlob(canvas, mimeType, format === 'bmp');
    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
    const bytes = await blob.arrayBuffer();

    const pageStr = String(i).padStart(3, '0');
    zip.file(`${baseName}_page_${pageStr}.${ext}`, bytes);

    onProgress?.(Math.round(15 + (i / numPages) * 75));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  onProgress?.(100);

  return {
    name: `${baseName}_${format.toUpperCase()}_pages.zip`,
    size: zipBlob.size,
    type: 'application/zip',
    url,
    blob: zipBlob,
    extraInfo: `Rendered ${numPages} pages as high-resolution ${format.toUpperCase()} images in ZIP`
  };
}

export async function addPdfWatermark(
  file: File,
  watermarkText: string = 'CONFIDENTIAL',
  opacity: number = 0.35,
  angle: number = 45
): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textSize = Math.min(width, height) / 8;
    const textWidth = font.widthOfTextAtSize(watermarkText, textSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textSize / 2,
      size: textSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: Math.max(0.05, Math.min(1.0, opacity)),
      rotate: degrees(angle)
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  return {
    name: `${baseName}_watermarked.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Added watermark "${watermarkText}" across all ${pages.length} pages`
  };
}

export async function addPdfPageNumbers(
  file: File,
  position: 'bottom-center' | 'bottom-right' | 'top-right' = 'bottom-center'
): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = `Page ${i + 1} of ${total}`;
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = 30;

    if (position === 'bottom-right') {
      x = width - textWidth - 40;
      y = 30;
    } else if (position === 'top-right') {
      x = width - textWidth - 40;
      y = height - 35;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.25, 0.25, 0.25)
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  return {
    name: `${baseName}_numbered.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Added page numbers (1 to ${total}) at ${position}`
  };
}

export async function updatePdfMetadata(
  file: File,
  title: string,
  author: string,
  subject: string
): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  if (title) pdfDoc.setTitle(title);
  if (author) pdfDoc.setAuthor(author);
  if (subject) pdfDoc.setSubject(subject);
  pdfDoc.setProducer('SFC Shadat Fatih Converter');

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  return {
    name: `${baseName}_metadata.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Updated document metadata (Title: "${title || 'N/A'}")`
  };
}

export async function duplicatePdfPages(file: File, pageNumber: number = 1): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const total = pdfDoc.getPageCount();

  const targetIdx = Math.max(0, Math.min(total - 1, pageNumber - 1));
  const [copiedPage] = await pdfDoc.copyPages(pdfDoc, [targetIdx]);
  pdfDoc.insertPage(targetIdx + 1, copiedPage);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  return {
    name: `${baseName}_page_duplicated.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Duplicated page ${pageNumber}. Total pages now: ${pdfDoc.getPageCount()}`
  };
}

// Helpers
export async function mergePdfs(files: File[]): Promise<ConvertedFile> {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return {
    name: `merged_${Date.now()}.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Merged ${files.length} documents into ${mergedPdf.getPageCount()} pages`
  };
}

export async function splitPdf(file: File, pageRangesStr?: string): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer);
  const totalPages = srcPdf.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages.');
  }

  if (pageRangesStr && pageRangesStr.trim().length > 0) {
    const targetPages: number[] = [];
    const parts = pageRangesStr.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            targetPages.push(p - 1);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          targetPages.push(p - 1);
        }
      }
    }

    if (targetPages.length === 0) {
      throw new Error('Invalid page ranges. Example: 1-3, 5');
    }

    const uniquePages = Array.from(new Set(targetPages)).sort((a, b) => a - b);
    const newPdf = await PDFDocument.create();
    const copied = await newPdf.copyPages(srcPdf, uniquePages);
    copied.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    return {
      name: `${file.name.replace(/\.pdf$/i, '')}_extracted.pdf`,
      size: blob.size,
      type: 'application/pdf',
      url,
      blob,
      extraInfo: `Extracted ${newPdf.getPageCount()} pages (${pageRangesStr})`
    };
  }

  const zip = new JSZip();
  for (let i = 0; i < totalPages; i++) {
    const singlePdf = await PDFDocument.create();
    const [copied] = await singlePdf.copyPages(srcPdf, [i]);
    singlePdf.addPage(copied);
    const bytes = await singlePdf.save();
    const pageNum = String(i + 1).padStart(3, '0');
    zip.file(`page_${pageNum}.pdf`, bytes);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);

  return {
    name: `${file.name.replace(/\.pdf$/i, '')}_split_pages.zip`,
    size: zipBlob.size,
    type: 'application/zip',
    url,
    blob: zipBlob,
    extraInfo: `Split into ${totalPages} individual PDF page files in a ZIP`
  };
}

export async function rotatePdf(file: File, angle: number = 90): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + angle) % 360));
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return {
    name: `${file.name.replace(/\.pdf$/i, '')}_rotated_${angle}deg.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Rotated ${pages.length} pages by ${angle}°`
  };
}

export async function deletePdfPages(file: File, pagesToDeleteStr: string): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const total = pdfDoc.getPageCount();

  const toDelete = new Set<number>();
  pagesToDeleteStr.split(',').forEach((p) => {
    const num = parseInt(p.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= total) {
      toDelete.add(num - 1);
    }
  });

  if (toDelete.size === 0) {
    throw new Error('Please specify valid page numbers to delete (e.g. 1, 3).');
  }

  if (toDelete.size >= total) {
    throw new Error('Cannot delete all pages in the PDF.');
  }

  const newDoc = await PDFDocument.create();
  const keepIndices = Array.from({ length: total }, (_, i) => i).filter((i) => !toDelete.has(i));
  const copied = await newDoc.copyPages(pdfDoc, keepIndices);
  copied.forEach((p) => newDoc.addPage(p));

  const bytes = await newDoc.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return {
    name: `${file.name.replace(/\.pdf$/i, '')}_pages_removed.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Deleted ${toDelete.size} pages. New page count: ${newDoc.getPageCount()}`
  };
}

export async function imagesToPdf(imageFiles: File[]): Promise<ConvertedFile> {
  if (imageFiles.length === 0) {
    throw new Error('Please select at least one image.');
  }

  const pdfDoc = await PDFDocument.create();

  for (const imgFile of imageFiles) {
    const buffer = await imgFile.arrayBuffer();
    let embeddedImage;

    if (imgFile.type === 'image/jpeg' || imgFile.name.match(/\.(jpg|jpeg)$/i)) {
      embeddedImage = await pdfDoc.embedJpg(buffer);
    } else if (imgFile.type === 'image/png' || imgFile.name.match(/\.png$/i)) {
      embeddedImage = await pdfDoc.embedPng(buffer);
    } else {
      const bitmap = await createImageBitmap(imgFile);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const res = await fetch(dataUrl);
        const pngBuf = await res.arrayBuffer();
        embeddedImage = await pdfDoc.embedPng(pngBuf);
      }
    }

    if (embeddedImage) {
      const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height
      });
    }
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  return {
    name: `images_${Date.now()}.pdf`,
    size: blob.size,
    type: 'application/pdf',
    url,
    blob,
    extraInfo: `Converted ${imageFiles.length} image(s) into a multi-page PDF`
  };
}

export async function extractPdfText(file: File): Promise<ConvertedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const fullText: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageStrings = content.items
      .map((item) => ('str' in item ? (item.str as string) : ''))
      .filter((s) => s.trim().length > 0);

    if (pageStrings.length > 0) {
      fullText.push(`--- Page ${i} ---\n` + pageStrings.join(' '));
    }
  }

  let extracted = fullText.join('\n\n').trim();

  if (extracted.length === 0) {
    extracted = `[Notice: No selectable text streams were detected in this PDF file.\n\nThis commonly occurs if the PDF was scanned from physical paper or contains rasterized images. For scanned PDFs, use our OCR tool to extract text.]`;
  }

  const blob = new Blob([extracted], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return {
    name: `${file.name.replace(/\.pdf$/i, '')}_extracted_text.txt`,
    size: blob.size,
    type: 'text/plain',
    url,
    blob,
    previewText: extracted.slice(0, 1000),
    extraInfo: `Extracted ${extracted.length} characters from ${numPages} pages`
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, isBmp: boolean = false): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (isBmp) {
      try {
        const bmpBlob = encodeBmp(canvas);
        resolve(bmpBlob);
      } catch (err) {
        reject(err);
      }
      return;
    }
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, mimeType, mimeType === 'image/png' ? undefined : 0.95);
  });
}

function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;

  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP Header
  view.setUint16(0, 0x4d42, true); // "BM"
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel offset

  // DIB Header
  view.setUint32(14, 40, true); // DIB header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // 24 bpp
  view.setUint32(34, pixelArraySize, true);

  const data = imgData.data;
  let offset = 54;

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      view.setUint8(offset++, data[p + 2]); // Blue
      view.setUint8(offset++, data[p + 1]); // Green
      view.setUint8(offset++, data[p]);     // Red
    }
    while (offset % 4 !== 0) {
      view.setUint8(offset++, 0); // padding
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}
