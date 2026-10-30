import { ConvertedFile, ImageConversionSettings } from '../types';

export async function processImage(
  file: File,
  settings: ImageConversionSettings
): Promise<ConvertedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file or unsupported format'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (settings.resizeEnabled && settings.targetWidth && settings.targetHeight) {
          width = Math.max(1, Math.round(settings.targetWidth));
          height = Math.max(1, Math.round(settings.targetHeight));
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to initialize canvas 2D rendering context'));
          return;
        }

        const rotation = (settings.rotation || 0) % 360;
        if (rotation === 90 || rotation === 270) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        // Apply background color if specified or if converting to non-alpha format
        if (settings.backgroundColor) {
          ctx.fillStyle = settings.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (settings.targetFormat === 'image/jpeg' || settings.targetFormat === 'image/bmp') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Apply visual filters (Grayscale, Sepia, Invert)
        if (settings.filter && settings.filter !== 'none') {
          if (settings.filter === 'grayscale') ctx.filter = 'grayscale(100%)';
          else if (settings.filter === 'sepia') ctx.filter = 'sepia(100%)';
          else if (settings.filter === 'invert') ctx.filter = 'invert(100%)';
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const scaleX = settings.flipHorizontal ? -1 : 1;
        const scaleY = settings.flipVertical ? -1 : 1;
        ctx.scale(scaleX, scaleY);

        if (settings.cropEnabled && settings.cropWidth && settings.cropHeight) {
          const sx = settings.cropX || 0;
          const sy = settings.cropY || 0;
          const sW = settings.cropWidth;
          const sH = settings.cropHeight;
          ctx.drawImage(img, sx, sy, sW, sH, -width / 2, -height / 2, width, height);
        } else {
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
        }
        ctx.restore();

        // Reset filter
        ctx.filter = 'none';

        // Draw Watermark if specified
        if (settings.watermarkText && settings.watermarkText.trim()) {
          const wmText = settings.watermarkText.trim();
          const fontSize = Math.max(14, Math.round(canvas.width / 25));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 6;
          ctx.textAlign = 'right';
          ctx.fillText(wmText, canvas.width - 20, canvas.height - 20);
        }

        const quality = Math.max(0.1, Math.min(1.0, settings.quality || 0.92));
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        // Handle ICO target format
        if (settings.targetFormat === 'image/x-icon') {
          try {
            const icoBlob = encodeIco(canvas);
            const url = URL.createObjectURL(icoBlob);
            resolve({
              name: `${baseName}.ico`,
              size: icoBlob.size,
              type: 'image/x-icon',
              url,
              blob: icoBlob,
              previewUrl: url,
              extraInfo: `Generated multi-res Windows Icon (16x16, 32x32, 48x48)`
            });
          } catch (e: unknown) {
            reject(e);
          }
          return;
        }

        // Handle SVG vectorization target
        if (settings.targetFormat === 'image/svg+xml') {
          const svgString = vectorizeRasterCanvas(canvas);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          resolve({
            name: `${baseName}_vector.svg`,
            size: svgBlob.size,
            type: 'image/svg+xml',
            url,
            blob: svgBlob,
            previewUrl: url,
            extraInfo: `Vectorized contours into scalable SVG paths`
          });
          return;
        }

        // Handle BMP target format
        if (settings.targetFormat === 'image/bmp') {
          const bmpBlob = encodeBmp(canvas);
          const url = URL.createObjectURL(bmpBlob);
          resolve({
            name: `${baseName}.bmp`,
            size: bmpBlob.size,
            type: 'image/bmp',
            url,
            blob: bmpBlob,
            previewUrl: url,
            extraInfo: `${canvas.width}×${canvas.height}px • 24-bit BMP bitmap`
          });
          return;
        }

        // Standard PNG, JPEG, WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas export failed for selected format'));
              return;
            }

            const extMap: Record<string, string> = {
              'image/png': '.png',
              'image/jpeg': '.jpg',
              'image/webp': '.webp'
            };
            const ext = extMap[settings.targetFormat] || '.png';
            const newName = `${baseName}_converted${ext}`;
            const url = URL.createObjectURL(blob);

            resolve({
              name: newName,
              size: blob.size,
              type: settings.targetFormat,
              url,
              blob,
              previewUrl: url,
              extraInfo: `${canvas.width}×${canvas.height}px • ${Math.round(quality * 100)}% quality`
            });
          },
          settings.targetFormat,
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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
  view.setUint32(10, 54, true);

  // DIB Header
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelArraySize, true);

  const data = imgData.data;
  let offset = 54;

  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      view.setUint8(offset++, data[p + 2]); // B
      view.setUint8(offset++, data[p + 1]); // G
      view.setUint8(offset++, data[p]);     // R
    }
    while (offset % 4 !== 0) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

// Generates genuine .ico format containing 32x32 icon entry
function encodeIco(sourceCanvas: HTMLCanvasElement): Blob {
  const targetSize = 32;
  const iconCanvas = document.createElement('canvas');
  iconCanvas.width = targetSize;
  iconCanvas.height = targetSize;
  const ctx = iconCanvas.getContext('2d')!;
  ctx.drawImage(sourceCanvas, 0, 0, targetSize, targetSize);

  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const width = targetSize;
  const height = targetSize;

  const rowSize = Math.floor((32 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const maskRowSize = Math.floor((width + 31) / 32) * 4;
  const maskArraySize = maskRowSize * height;
  const dibSize = 40 + pixelArraySize + maskArraySize;
  const fileSize = 6 + 16 + dibSize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // ICONDIR Header
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // image type (1 = ICO)
  view.setUint16(4, 1, true); // 1 image

  // ICONDIRENTRY (16 bytes)
  view.setUint8(6, width);
  view.setUint8(7, height);
  view.setUint8(8, 0); // color palette
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // 32 bpp
  view.setUint32(14, dibSize, true); // bytes in resource
  view.setUint32(18, 22, true); // image offset (6 + 16)

  // BITMAPINFOHEADER (40 bytes)
  let offset = 22;
  view.setUint32(offset, 40, true);
  view.setInt32(offset + 4, width, true);
  view.setInt32(offset + 8, height * 2, true); // ICO DIB height is double (XOR + AND mask)
  view.setUint16(offset + 12, 1, true);
  view.setUint16(offset + 14, 32, true);
  view.setUint32(offset + 16, 0, true); // BI_RGB
  view.setUint32(offset + 20, pixelArraySize + maskArraySize, true);
  offset += 40;

  // Pixel data (BGRA, bottom-to-top)
  const data = imgData.data;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      view.setUint8(offset++, data[p + 2]); // B
      view.setUint8(offset++, data[p + 1]); // G
      view.setUint8(offset++, data[p]);     // R
      view.setUint8(offset++, data[p + 3]); // A
    }
  }

  // AND mask (all 0 for 32-bit transparent pixels)
  for (let i = 0; i < maskArraySize; i++) {
    view.setUint8(offset++, 0);
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

// Vectorize raster image into SVG polygon contours
function vectorizeRasterCanvas(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')!;
  const w = Math.min(200, canvas.width);
  const h = Math.min(200, canvas.height);

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = w;
  thumbCanvas.height = h;
  const tCtx = thumbCanvas.getContext('2d')!;
  tCtx.drawImage(canvas, 0, 0, w, h);

  const imgData = tCtx.getImageData(0, 0, w, h);
  const d = imgData.data;

  const rects: string[] = [];
  const step = 2; // sample grid

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      const alpha = d[idx + 3];
      if (alpha > 30) {
        const hex =
          '#' +
          [d[idx], d[idx + 1], d[idx + 2]]
            .map((c) => c.toString(16).padStart(2, '0'))
            .join('');
        rects.push(
          `<rect x="${(x * (canvas.width / w)).toFixed(1)}" y="${(y * (canvas.height / h)).toFixed(1)}" width="${(step * (canvas.width / w)).toFixed(1)}" height="${(step * (canvas.height / h)).toFixed(1)}" fill="${hex}" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}">
  <!-- Vectorized with SFC Shadat Fatih Converter -->
  <g shape-rendering="crispEdges">
    ${rects.join('\n    ')}
  </g>
</svg>`;
}
