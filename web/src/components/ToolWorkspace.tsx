import React, { useState, useEffect, useRef } from 'react';
import {
  ConversionTool,
  Language,
  ConvertedFile,
  ImageConversionSettings,
  ConversionStatus
} from '../types';
import { translations } from '../i18n/translations';
import {
  X,
  UploadCloud,
  FileCheck,
  Download,
  RotateCcw,
  AlertCircle,
  Loader2,
  Trash2,
  Sliders,
  CheckCircle2,
  Eye,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Engines
import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  deletePdfPages,
  imagesToPdf,
  extractPdfText,
  convertPdfToImages,
  addPdfWatermark,
  addPdfPageNumbers,
  updatePdfMetadata,
  pdfToDocx,
  pdfToSpreadsheet,
  compressPdf,
  resizePdfPages,
  addSignatureStamp
} from '../engines/pdfEngine';
import { processImage } from '../engines/imageEngine';
import { generateQrCode, generateBarcode } from '../engines/qrBarcodeEngine';
import {
  analyzeText,
  convertCase,
  cleanText,
  reverseText,
  imageToBase64,
  base64ToImage,
  formatAndValidateJson
} from '../engines/textUtilityEngine';
import {
  convertCsvToXlsx,
  convertXlsxToCsv,
  convertCsvToTsv,
  convertXlsxToJson,
  convertJsonToXlsx,
  convertJsonToCsv,
  convertSpreadsheetToPdf,
  convertSpreadsheetToHtml,
  convertXmlToJson,
  convertJsonToXml,
  parseSpreadsheetPreview,
  SpreadsheetPreview
} from '../engines/spreadsheetEngine';
import {
  convertTxtToDocx,
  convertMarkdownToDocx,
  convertHtmlToDocx,
  convertDocxToHtml,
  extractDocxText,
  convertTxtToPdf,
  convertHtmlToPdf
} from '../engines/documentEngine';
import { convertPptxToPdf, extractPptxSlidesToZip } from '../engines/presentationEngine';
import { createZipArchive, extractZipArchive, ExtractedArchiveFile } from '../engines/archiveEngine';
import {
  extractOrConvertAudio,
  extractVideoFramesToZip,
  convertVideoToGif
} from '../engines/mediaEngine';
import { performOcr } from '../engines/ocrEngine';
import { calculateChecksums, inspectFileMetadata } from '../engines/utilityEngine';

interface ToolWorkspaceProps {
  tool: ConversionTool;
  language: Language;
  onClose: () => void;
  onToolUsed: (toolId: string) => void;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  tool,
  language,
  onClose,
  onToolUsed
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<ConvertedFile | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<ExtractedArchiveFile[]>([]);
  const [spreadsheetPreview, setSpreadsheetPreview] = useState<SpreadsheetPreview | null>(null);

  // Settings States
  const [imageSettings, setImageSettings] = useState<ImageConversionSettings>({
    targetFormat: 'image/webp',
    quality: 0.85,
    resizeEnabled: false,
    targetWidth: 1200,
    targetHeight: 800,
    maintainAspectRatio: true,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false
  });

  const [pdfPageRange, setPdfPageRange] = useState('');
  const [pdfRotateAngle, setPdfRotateAngle] = useState(90);
  const [pdfPagesToDelete, setPdfPagesToDelete] = useState('');
  const [pdfTargetImageFormat, setPdfTargetImageFormat] = useState<'png' | 'jpeg' | 'webp' | 'bmp'>('png');
  const [pdfDpi, setPdfDpi] = useState<number>(300);
  const [pdfWatermarkText, setPdfWatermarkText] = useState('CONFIDENTIAL');
  const [pdfWatermarkOpacity, setPdfWatermarkOpacity] = useState(0.35);
  const [pdfPageNumberPos, setPdfPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [pdfMetaTitle, setPdfMetaTitle] = useState('');
  const [pdfMetaAuthor, setPdfMetaAuthor] = useState('');

  const [archiveLevel, setArchiveLevel] = useState<1 | 5 | 9>(5);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [audioTargetFormat, setAudioTargetFormat] = useState<'wav' | 'mp3' | 'ogg' | 'flac'>('wav');

  // New Tool States
  const [pdfPageSize, setPdfPageSize] = useState<'A4' | 'A3' | 'Letter' | 'Legal'>('A4');
  const [pdfSignatureFile, setPdfSignatureFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [qrFormat, setQrFormat] = useState<'png' | 'svg'>('png');
  const [qrColorDark, setQrColorDark] = useState('#0B132B');
  const [qrColorLight, setQrColorLight] = useState('#ffffff');
  const [caseType, setCaseType] = useState<'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'snake' | 'kebab' | 'constant'>('upper');
  const [cleanOptions, setCleanOptions] = useState({
    removeDuplicateLines: true,
    trimLines: true,
    removeEmptyLines: true
  });
  const [reverseMode, setReverseMode] = useState<'text' | 'words'>('text');
  const [jsonIndentation, setJsonIndentation] = useState(2);
  const [colorInput, setColorInput] = useState('#38BDF8');
  const [unitValue, setUnitValue] = useState(1024);
  const [unitFrom, setUnitFrom] = useState<'MB' | 'GB' | 'KB' | 'Bytes'>('MB');

  const isDirectInputTool =
    tool.category === 'qr-barcode' ||
    tool.category === 'text' ||
    ['unit-converter', 'color-picker', 'json-formatter', 'img-base64'].includes(tool.id);

  // Allow multiple file select for batch tools
  const allowsMultiple =
    tool.id === 'pdf-merge' || tool.id === 'img-to-pdf' || tool.id === 'zip-create' || tool.id === 'pdf-signature';

  useEffect(() => {
    return () => {
      if (convertedResult?.url) URL.revokeObjectURL(convertedResult.url);
      extractedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [convertedResult, extractedFiles]);

  useEffect(() => {
    if (tool.id === 'img-to-ico') {
      setImageSettings((s) => ({ ...s, targetFormat: 'image/x-icon' }));
    } else if (tool.id === 'img-to-svg') {
      setImageSettings((s) => ({ ...s, targetFormat: 'image/svg+xml' }));
    } else if (tool.id === 'img-compress') {
      setImageSettings((s) => ({ ...s, quality: 0.65 }));
    }
  }, [tool.id]);

  const handleFileChange = async (selected: FileList | null) => {
    if (!selected || selected.length === 0) return;
    setErrorMessage(null);
    setConvertedResult(null);

    const fileList = Array.from(selected);
    const maxBytes = tool.maxFileSizeMB * 1024 * 1024;
    for (const f of fileList) {
      if (f.size > maxBytes) {
        setErrorMessage(`${f.name} exceeds the ${tool.maxFileSizeMB} MB limit.`);
        return;
      }
    }

    setFiles(fileList);

    if (tool.category === 'spreadsheet' && fileList[0]) {
      try {
        const preview = await parseSpreadsheetPreview(fileList[0]);
        setSpreadsheetPreview(preview);
        setSelectedSheet(preview.activeSheet);
      } catch {
        // Safe skip
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const startConversion = async () => {
    const hasDirectInput =
      isDirectInputTool &&
      (textContent.trim().length > 0 ||
        tool.id === 'unit-converter' ||
        tool.id === 'color-picker' ||
        tool.id === 'barcode-generator' ||
        tool.id === 'qr-generator');

    if (files.length === 0 && !hasDirectInput) {
      setErrorMessage(t.errorNoFile);
      return;
    }

    try {
      setStatus('processing');
      setProgress(15);
      setErrorMessage(null);

      let result: ConvertedFile;

      switch (tool.id) {
        // PDF Tools
        case 'pdf-to-img':
          result = await convertPdfToImages(files[0], pdfTargetImageFormat, pdfDpi / 72, (p) => setProgress(p));
          break;
        case 'pdf-merge':
          setProgress(40);
          result = await mergePdfs(files);
          break;
        case 'pdf-split':
          setProgress(50);
          result = await splitPdf(files[0], pdfPageRange);
          break;
        case 'img-to-pdf':
          setProgress(50);
          result = await imagesToPdf(files);
          break;
        case 'pdf-to-docx':
          result = await pdfToDocx(files[0], (p) => setProgress(p));
          break;
        case 'pdf-to-excel':
          result = await pdfToSpreadsheet(files[0], 'xlsx');
          break;
        case 'pdf-compress':
          setProgress(40);
          result = await compressPdf(files[0]);
          break;
        case 'pdf-resize-page':
          setProgress(40);
          result = await resizePdfPages(files[0], pdfPageSize);
          break;
        case 'pdf-signature':
          setProgress(40);
          if (!pdfSignatureFile && files.length < 2) {
            throw new Error('Please select both a PDF document and a signature image.');
          }
          result = await addSignatureStamp(files[0], pdfSignatureFile || files[1]);
          break;
        case 'pdf-watermark':
          setProgress(50);
          result = await addPdfWatermark(files[0], pdfWatermarkText, pdfWatermarkOpacity);
          break;
        case 'pdf-page-numbers':
          setProgress(50);
          result = await addPdfPageNumbers(files[0], pdfPageNumberPos);
          break;
        case 'pdf-rotate':
          setProgress(50);
          result = await rotatePdf(files[0], pdfRotateAngle);
          break;
        case 'pdf-delete-pages':
          setProgress(50);
          result = await deletePdfPages(files[0], pdfPagesToDelete);
          break;
        case 'pdf-to-text':
          setProgress(60);
          result = await extractPdfText(files[0]);
          break;
        case 'pdf-metadata':
          setProgress(60);
          result = await updatePdfMetadata(files[0], pdfMetaTitle, pdfMetaAuthor, '');
          break;
        case 'ocr-tool':
          result = await performOcr(files[0], 'eng', (p) => setProgress(p));
          break;

        // Image Tools
        case 'img-convert':
        case 'img-to-ico':
        case 'img-to-svg':
        case 'img-compress':
        case 'img-resize':
        case 'img-crop':
        case 'img-filter':
          setProgress(50);
          result = await processImage(files[0], {
            ...imageSettings,
            cropEnabled: tool.id === 'img-crop'
          });
          break;

        // Document Tools
        case 'txt-to-docx':
          setProgress(50);
          result = await convertTxtToDocx(files[0]);
          break;
        case 'md-to-docx':
          setProgress(50);
          result = await convertMarkdownToDocx(files[0]);
          break;
        case 'html-to-docx':
          setProgress(50);
          result = await convertHtmlToDocx(files[0]);
          break;
        case 'docx-to-html':
          setProgress(50);
          result = await convertDocxToHtml(files[0]);
          break;
        case 'docx-extract':
          setProgress(50);
          result = await extractDocxText(files[0]);
          break;
        case 'txt-to-pdf':
          setProgress(50);
          result = await convertTxtToPdf(files[0]);
          break;
        case 'html-to-pdf':
          setProgress(50);
          result = await convertHtmlToPdf(files[0]);
          break;

        // Spreadsheet Tools
        case 'csv-to-xlsx':
          setProgress(50);
          result = await convertCsvToXlsx(files[0]);
          break;
        case 'xlsx-to-csv':
          setProgress(50);
          result = await convertXlsxToCsv(files[0], selectedSheet, ',');
          break;
        case 'csv-to-tsv':
          setProgress(50);
          result = await convertCsvToTsv(files[0]);
          break;
        case 'sheet-to-pdf':
          setProgress(50);
          result = await convertSpreadsheetToPdf(files[0]);
          break;
        case 'sheet-to-html':
          setProgress(50);
          result = await convertSpreadsheetToHtml(files[0]);
          break;
        case 'xlsx-to-json':
          setProgress(50);
          result = await convertXlsxToJson(files[0], selectedSheet);
          break;
        case 'json-to-xlsx':
          setProgress(50);
          result = await convertJsonToXlsx(files[0]);
          break;
        case 'json-to-csv':
          setProgress(50);
          result = await convertJsonToCsv(files[0]);
          break;
        case 'xml-to-json':
          setProgress(50);
          result = await convertXmlToJson(files[0]);
          break;
        case 'json-to-xml':
          setProgress(50);
          result = await convertJsonToXml(files[0]);
          break;

        // Presentation Tools
        case 'pptx-to-pdf':
          setProgress(50);
          result = await convertPptxToPdf(files[0]);
          break;
        case 'pptx-to-images':
          setProgress(50);
          result = await extractPptxSlidesToZip(files[0]);
          break;

        // Audio & Video Tools
        case 'audio-convert':
          result = await extractOrConvertAudio(files[0], audioTargetFormat, (p) => setProgress(p));
          break;
        case 'video-audio-extract':
          result = await extractOrConvertAudio(files[0], 'wav', (p) => setProgress(p));
          break;
        case 'video-to-frames':
          result = await extractVideoFramesToZip(files[0], 8, (p) => setProgress(p));
          break;
        case 'video-to-gif':
          result = await convertVideoToGif(files[0], 5, 4, (p) => setProgress(p));
          break;

        // Archive Tools
        case 'zip-create':
          setProgress(50);
          result = await createZipArchive(files, archiveLevel);
          break;
        case 'zip-extract': {
          setProgress(50);
          const zipRes = await extractZipArchive(files[0]);
          setExtractedFiles(zipRes.files);
          result = zipRes.summary;
          break;
        }

        // QR & Barcode Tools
        case 'qr-generator': {
          setProgress(40);
          const raw = textContent.trim() || (files[0] ? await files[0].text() : 'https://shadatfatihbd.github.io/Shadat-Fatih-Converter-/');
          result = await generateQrCode({
            text: raw,
            format: qrFormat,
            darkColor: qrColorDark,
            lightColor: qrColorLight,
            size: 512
          });
          break;
        }
        case 'barcode-generator': {
          setProgress(40);
          const raw = textContent.trim() || (files[0] ? (await files[0].text()).trim() : 'SFC-2026');
          result = await generateBarcode(raw, 480, 160);
          break;
        }

        // Text Tools
        case 'word-counter': {
          setProgress(40);
          const raw = files[0] ? await files[0].text() : textContent;
          const stats = analyzeText(raw);
          const report = [
            `SFC Word & Text Analytics Report`,
            `=================================`,
            `Words:                  ${stats.words}`,
            `Characters (total):     ${stats.characters}`,
            `Characters (no spaces): ${stats.charactersNoSpaces}`,
            `Lines:                  ${stats.lines}`,
            `Paragraphs:             ${stats.paragraphs}`,
            `Estimated Reading Time: ${stats.readingTimeMin} min`,
            `=================================`,
            `Original Text Sample:`,
            raw.slice(0, 300)
          ].join('\n');
          const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
          result = {
            name: `text-analysis-${Date.now()}.txt`,
            size: blob.size,
            type: 'text/plain',
            url: URL.createObjectURL(blob),
            blob,
            previewText: report,
            extraInfo: `${stats.words} words, ${stats.characters} chars, ${stats.lines} lines`
          };
          break;
        }
        case 'case-converter': {
          setProgress(40);
          const raw = files[0] ? await files[0].text() : textContent;
          const converted = convertCase(raw, caseType);
          const blob = new Blob([converted], { type: 'text/plain;charset=utf-8' });
          result = {
            name: `converted-${caseType}-${Date.now()}.txt`,
            size: blob.size,
            type: 'text/plain',
            url: URL.createObjectURL(blob),
            blob,
            previewText: converted
          };
          break;
        }
        case 'text-cleaner': {
          setProgress(40);
          const raw = files[0] ? await files[0].text() : textContent;
          const cleaned = cleanText(raw, cleanOptions.trimLines, cleanOptions.removeDuplicateLines);
          const blob = new Blob([cleaned], { type: 'text/plain;charset=utf-8' });
          result = {
            name: `cleaned-text-${Date.now()}.txt`,
            size: blob.size,
            type: 'text/plain',
            url: URL.createObjectURL(blob),
            blob,
            previewText: cleaned
          };
          break;
        }
        case 'text-reverser': {
          setProgress(40);
          const raw = files[0] ? await files[0].text() : textContent;
          const reversed = reverseText(raw, reverseMode === 'words' ? 'words' : 'chars');
          const blob = new Blob([reversed], { type: 'text/plain;charset=utf-8' });
          result = {
            name: `reversed-${Date.now()}.txt`,
            size: blob.size,
            type: 'text/plain',
            url: URL.createObjectURL(blob),
            blob,
            previewText: reversed
          };
          break;
        }

        // Utility Tools
        case 'file-checksum':
          setProgress(50);
          result = await calculateChecksums(files[0]);
          break;
        case 'file-metadata':
          setProgress(50);
          result = await inspectFileMetadata(files[0]);
          break;
        case 'img-base64': {
          setProgress(40);
          if (files[0] && files[0].type.startsWith('image/')) {
            result = await imageToBase64(files[0]);
          } else {
            const raw = textContent.trim() || (files[0] ? await files[0].text() : '');
            result = await base64ToImage(raw);
          }
          break;
        }
        case 'json-formatter': {
          setProgress(40);
          const raw = files[0] ? await files[0].text() : textContent;
          const jsonRes = formatAndValidateJson(raw, jsonIndentation === 0 ? 'minify' : 'pretty');
          if (!jsonRes.isValid) {
            throw new Error(`JSON Syntax Error: ${jsonRes.error || 'Invalid JSON format'}`);
          }
          const blob = new Blob([jsonRes.result], { type: 'application/json;charset=utf-8' });
          result = {
            name: `formatted-${Date.now()}.json`,
            size: blob.size,
            type: 'application/json',
            url: URL.createObjectURL(blob),
            blob,
            previewText: jsonRes.result
          };
          break;
        }
        case 'unit-converter': {
          setProgress(50);
          const val = unitValue;
          let bytes = 0;
          if (unitFrom === 'Bytes') bytes = val;
          else if (unitFrom === 'KB') bytes = val * 1024;
          else if (unitFrom === 'MB') bytes = val * 1024 * 1024;
          else if (unitFrom === 'GB') bytes = val * 1024 * 1024 * 1024;

          const summary = [
            `SFC Unit & Storage Conversion Report`,
            `=====================================`,
            `Input: ${val} ${unitFrom}`,
            `-------------------------------------`,
            `Bytes:          ${bytes.toLocaleString()} B`,
            `Kilobytes (KB): ${(bytes / 1024).toFixed(4)} KB`,
            `Megabytes (MB): ${(bytes / (1024 * 1024)).toFixed(4)} MB`,
            `Gigabytes (GB): ${(bytes / (1024 * 1024 * 1024)).toFixed(6)} GB`,
            `Terabytes (TB): ${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(8)} TB`,
            `-------------------------------------`,
            `Decimal (SI) Comparison:`,
            `KB (10^3): ${(bytes / 1000).toFixed(4)} KB`,
            `MB (10^6): ${(bytes / 1000000).toFixed(4)} MB`,
            `GB (10^9): ${(bytes / 1000000000).toFixed(6)} GB`
          ].join('\n');

          const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
          result = {
            blob,
            name: `unit-conversion-${val}-${unitFrom}.txt`,
            size: blob.size,
            type: 'text/plain',
            url: URL.createObjectURL(blob),
            previewText: summary
          };
          break;
        }
        case 'color-picker': {
          setProgress(50);
          const hex = colorInput.trim().startsWith('#') ? colorInput.trim() : `#${colorInput.trim()}`;
          const cleanHex = hex.replace('#', '');
          let r = 0, g = 0, b = 0;
          if (cleanHex.length === 3) {
            r = parseInt(cleanHex[0] + cleanHex[0], 16) || 0;
            g = parseInt(cleanHex[1] + cleanHex[1], 16) || 0;
            b = parseInt(cleanHex[2] + cleanHex[2], 16) || 0;
          } else if (cleanHex.length >= 6) {
            r = parseInt(cleanHex.substring(0, 2), 16) || 0;
            g = parseInt(cleanHex.substring(2, 4), 16) || 0;
            b = parseInt(cleanHex.substring(4, 6), 16) || 0;
          }
          const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
          let h = 0, s = 0, l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
              case gNorm: h = (bNorm - rNorm) / d + 2; break;
              case bNorm: h = (rNorm - gNorm) / d + 4; break;
            }
            h /= 6;
          }
          const hslStr = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
          const rgbStr = `rgb(${r}, ${g}, ${b})`;
          const cmykC = 1 - (r / 255), cmykM = 1 - (g / 255), cmykY = 1 - (b / 255), cmykK = Math.min(cmykC, cmykM, cmykY);
          const cmykStr = `cmyk(${Math.round((cmykC - cmykK) / (1 - cmykK || 1) * 100)}%, ${Math.round((cmykM - cmykK) / (1 - cmykK || 1) * 100)}%, ${Math.round((cmykY - cmykK) / (1 - cmykK || 1) * 100)}%, ${Math.round(cmykK * 100)}%)`;

          const report = [
            `SFC Color Converter & Palette Code`,
            `===================================`,
            `HEX:      ${hex.toUpperCase()}`,
            `RGB:      ${rgbStr}`,
            `RGBA:     rgba(${r}, ${g}, ${b}, 1.0)`,
            `HSL:      ${hslStr}`,
            `CMYK:     ${cmykStr}`,
            `-----------------------------------`,
            `CSS Export:`,
            `--color-primary: ${hex.toUpperCase()};`,
            `background-color: ${hex.toUpperCase()};`,
            `color: ${l > 0.5 ? '#000000' : '#FFFFFF'}; /* Optimal contrast */`
          ].join('\n');

          const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
          result = {
            blob,
            name: `color-${cleanHex}.txt`,
            size: blob.size,
            type: 'text/plain',
            url: URL.createObjectURL(blob),
            previewText: report
          };
          break;
        }

        default:
          throw new Error('This tool configuration is being prepared.');
      }

      setProgress(100);
      setConvertedResult(result);
      setStatus('success');
      onToolUsed(tool.id);

      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Safe skip
      }
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : t.errorFailed;
      setErrorMessage(msg);
    }
  };

  const handleDownload = (file: ConvertedFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const originalTotalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-apple-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1C1C1E] rounded-[24px] border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-window dark:shadow-apple-dark-window overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* macOS Window Title Bar */}
        <div className="px-5 py-3.5 border-b border-[#D2D2D7]/80 dark:border-[#38383A]/80 flex items-center justify-between bg-[#F5F5F7] dark:bg-[#2C2C2E]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                <span>{t[tool.nameKey] || tool.id}</span>
                <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] text-[#86868B] dark:text-[#98989D]">
                  {tool.category}
                </span>
              </h2>
              <p className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-0.5">{t[tool.descKey]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Direct Input Controls for Text, QR, Barcode, Units, and Color Tools */}
          {isDirectInputTool && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {tool.id === 'color-picker'
                  ? 'Color Code Converter'
                  : tool.id === 'unit-converter'
                  ? 'Unit & Storage Calculator'
                  : 'Direct Input (or upload file below)'}
              </label>

              {tool.id === 'color-picker' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorInput.startsWith('#') ? colorInput : `#${colorInput}`}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    placeholder="#38BDF8"
                    className="flex-1 p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-mono text-sm"
                  />
                </div>
              ) : tool.id === 'unit-converter' ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Value</label>
                    <input
                      type="number"
                      value={unitValue}
                      onChange={(e) => setUnitValue(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Unit</label>
                    <select
                      value={unitFrom}
                      onChange={(e) => setUnitFrom(e.target.value as any)}
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                    >
                      <option value="Bytes">Bytes (B)</option>
                      <option value="KB">Kilobytes (KB)</option>
                      <option value="MB">Megabytes (MB)</option>
                      <option value="GB">Gigabytes (GB)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <textarea
                  rows={4}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={
                    tool.id === 'qr-generator'
                      ? 'Enter website URL or text for QR code (e.g. https://shadatfatihbd.github.io/Shadat-Fatih-Converter-/)...'
                      : tool.id === 'barcode-generator'
                      ? 'Enter alphanumeric text for Code-128 Barcode (e.g. SFC-2026)...'
                      : tool.id === 'json-formatter'
                      ? 'Paste JSON code here to format and validate...'
                      : tool.id === 'img-base64'
                      ? 'Paste base64 image string here to decode...'
                      : 'Type or paste text content here...'
                  }
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              )}
            </div>
          )}

          {/* File Upload Zone */}
          {files.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D2D2D7] dark:border-[#38383A] hover:border-[#0071E3] dark:hover:border-[#0A84FF] rounded-[20px] p-8 sm:p-12 text-center cursor-pointer transition-colors bg-[#F5F5F7]/40 dark:bg-[#2C2C2E]/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={allowsMultiple}
                accept={tool.inputExtensions.includes('*') ? undefined : tool.inputExtensions.join(',')}
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-[14px] bg-[#E5E5EA] dark:bg-[#3A3A3C] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mx-auto mb-3 shadow-apple-sm transition-transform group-hover:scale-105">
                <UploadCloud className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {t.dropTitle}
              </h3>
              <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-1">
                {t.dropSubtitle}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium px-3 py-1 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#98989D]">
                <span>Supported: {tool.inputExtensions.join(', ')}</span>
                <span>•</span>
                <span>Max: {tool.maxFileSizeMB} MB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#98989D]">
                  Selected Files ({files.length})
                </span>
                <button
                  onClick={() => {
                    setFiles([]);
                    setConvertedResult(null);
                    setExtractedFiles([]);
                    setStatus('idle');
                  }}
                  className="text-xs text-[#FF2D55] hover:opacity-80 flex items-center gap-1 font-medium transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.resetBtn}
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileCheck className="w-4 h-4 text-[#0071E3] dark:text-[#0A84FF] shrink-0" />
                      <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[#86868B] dark:text-[#98989D] text-[11px] font-apple-mono shrink-0 ml-2">
                      {formatSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tool Settings */}
              {status !== 'success' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Sliders className="w-4 h-4 text-sky-500" />
                    <span>{t.settings}</span>
                  </div>

                  {/* PDF to Image Settings */}
                  {tool.id === 'pdf-to-img' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          {t.formatLabel}
                        </label>
                        <select
                          value={pdfTargetImageFormat}
                          onChange={(e) => setPdfTargetImageFormat(e.target.value as 'png' | 'jpeg' | 'webp' | 'bmp')}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        >
                          <option value="png">PNG (Lossless, High Quality)</option>
                          <option value="jpeg">JPG / JPEG (Compact File Size)</option>
                          <option value="webp">WebP (Modern Optimized)</option>
                          <option value="bmp">BMP (24-bit Raw Bitmap)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Output Resolution
                        </label>
                        <select
                          value={pdfDpi}
                          onChange={(e) => setPdfDpi(Number(e.target.value))}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        >
                          <option value={600}>Ultra HD (600 DPI - Print Quality)</option>
                          <option value={300}>Full HD (300 DPI - Recommended)</option>
                          <option value={150}>High (150 DPI)</option>
                          <option value={72}>Standard (72 DPI - Small File)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* PDF Watermark Settings */}
                  {tool.id === 'pdf-watermark' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          {t.watermarkTextLabel}
                        </label>
                        <input
                          type="text"
                          value={pdfWatermarkText}
                          onChange={(e) => setPdfWatermarkText(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          <span>{t.watermarkOpacityLabel}</span>
                          <span>{Math.round(pdfWatermarkOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="0.9"
                          step="0.05"
                          value={pdfWatermarkOpacity}
                          onChange={(e) => setPdfWatermarkOpacity(parseFloat(e.target.value))}
                          className="w-full accent-sky-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF Page Numbers */}
                  {tool.id === 'pdf-page-numbers' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {t.pageNumberPosLabel}
                      </label>
                      <select
                        value={pdfPageNumberPos}
                        onChange={(e) => setPdfPageNumberPos(e.target.value as 'bottom-center' | 'bottom-right' | 'top-right')}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="bottom-center">Bottom Center (Standard)</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="top-right">Top Right</option>
                      </select>
                    </div>
                  )}

                  {/* PDF Metadata */}
                  {tool.id === 'pdf-metadata' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Document Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Annual Report 2026"
                          value={pdfMetaTitle}
                          onChange={(e) => setPdfMetaTitle(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Author Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Shadat Fatih"
                          value={pdfMetaAuthor}
                          onChange={(e) => setPdfMetaAuthor(e.target.value)}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Settings */}
                  {tool.category === 'image' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          {t.formatLabel}
                        </label>
                        <select
                          value={imageSettings.targetFormat}
                          onChange={(e) =>
                            setImageSettings({
                              ...imageSettings,
                              targetFormat: e.target.value as ImageConversionSettings['targetFormat']
                            })
                          }
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        >
                          <option value="image/webp">WebP (Modern, Small Size)</option>
                          <option value="image/png">PNG (Lossless with Alpha)</option>
                          <option value="image/jpeg">JPG / JPEG (Standard)</option>
                          <option value="image/bmp">BMP (24-bit Bitmap)</option>
                          <option value="image/x-icon">ICO (Windows Icon)</option>
                          <option value="image/svg+xml">SVG (Vector Tracing)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          <span>{t.qualityLabel}</span>
                          <span>{Math.round(imageSettings.quality * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={imageSettings.quality}
                          onChange={(e) =>
                            setImageSettings({
                              ...imageSettings,
                              quality: parseFloat(e.target.value)
                            })
                          }
                          className="w-full accent-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          {t.rotationAngle}
                        </label>
                        <select
                          value={imageSettings.rotation}
                          onChange={(e) =>
                            setImageSettings({
                              ...imageSettings,
                              rotation: parseInt(e.target.value, 10)
                            })
                          }
                          className="w-full p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        >
                          <option value="0">0° (Original)</option>
                          <option value="90">90° Clockwise</option>
                          <option value="180">180° Flip</option>
                          <option value="270">270° Counter-Clockwise</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={imageSettings.flipHorizontal}
                            onChange={(e) => setImageSettings({ ...imageSettings, flipHorizontal: e.target.checked })}
                            className="rounded accent-sky-500"
                          />
                          <span>Flip Horizontal</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={imageSettings.flipVertical}
                            onChange={(e) => setImageSettings({ ...imageSettings, flipVertical: e.target.checked })}
                            className="rounded accent-sky-500"
                          />
                          <span>Flip Vertical</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Audio Format Selector */}
                  {tool.id === 'audio-convert' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {t.formatLabel}
                      </label>
                      <select
                        value={audioTargetFormat}
                        onChange={(e) => setAudioTargetFormat(e.target.value as 'wav' | 'mp3' | 'ogg' | 'flac')}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="wav">WAV (Lossless 16-bit PCM)</option>
                        <option value="mp3">MP3 Audio</option>
                        <option value="flac">FLAC Lossless</option>
                        <option value="ogg">OGG Vorbis</option>
                      </select>
                    </div>
                  )}

                  {/* PDF Split Range */}
                  {tool.id === 'pdf-split' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {t.selectPages}
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank for all pages in a ZIP, or type e.g. 1-3, 5"
                        value={pdfPageRange}
                        onChange={(e) => setPdfPageRange(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Archive Compression */}
                  {tool.id === 'zip-create' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        {t.compressionLevel}
                      </label>
                      <select
                        value={archiveLevel}
                        onChange={(e) => setArchiveLevel(parseInt(e.target.value, 10) as 1 | 5 | 9)}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="1">{t.compFast}</option>
                        <option value="5">{t.compStandard}</option>
                        <option value="9">{t.compMax}</option>
                      </select>
                    </div>
                  )}

                  {/* PDF Resize Page */}
                  {tool.id === 'pdf-resize-page' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Target Page Size
                      </label>
                      <select
                        value={pdfPageSize}
                        onChange={(e) => setPdfPageSize(e.target.value as 'A4' | 'A3' | 'Letter' | 'Legal')}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="A4">A4 (210 x 297 mm - Standard)</option>
                        <option value="A3">A3 (297 x 420 mm - Large Format)</option>
                        <option value="Letter">US Letter (8.5 x 11 in)</option>
                        <option value="Legal">US Legal (8.5 x 14 in)</option>
                      </select>
                    </div>
                  )}

                  {/* PDF Digital Signature */}
                  {tool.id === 'pdf-signature' && (
                    <div className="text-xs space-y-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Signature Stamp Image (PNG / Transparent)
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPdfSignatureFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 cursor-pointer"
                      />
                      {pdfSignatureFile && (
                        <p className="text-[11px] text-emerald-500 font-semibold">Loaded: {pdfSignatureFile.name}</p>
                      )}
                    </div>
                  )}

                  {/* Image Filter & Background Settings */}
                  {tool.id === 'img-filter' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Color Filter
                        </label>
                        <select
                          value={imageSettings.filter || 'none'}
                          onChange={(e) =>
                            setImageSettings({
                              ...imageSettings,
                              filter: e.target.value as 'none' | 'grayscale' | 'sepia' | 'invert'
                            })
                          }
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        >
                          <option value="none">None (Natural Colors)</option>
                          <option value="grayscale">Grayscale (B&W)</option>
                          <option value="sepia">Sepia (Warm Vintage)</option>
                          <option value="invert">Invert (Negative)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          Background Fill Color
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. #FFFFFF or transparent"
                          value={imageSettings.backgroundColor || ''}
                          onChange={(e) => setImageSettings({ ...imageSettings, backgroundColor: e.target.value })}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* QR Code Settings */}
                  {tool.id === 'qr-generator' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Format</label>
                        <select
                          value={qrFormat}
                          onChange={(e) => setQrFormat(e.target.value as 'png' | 'svg')}
                          className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                        >
                          <option value="png">PNG (Raster)</option>
                          <option value="svg">SVG (Vector)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">QR Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={qrColorDark}
                            onChange={(e) => setQrColorDark(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={qrColorDark}
                            onChange={(e) => setQrColorDark(e.target.value)}
                            className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={qrColorLight}
                            onChange={(e) => setQrColorLight(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={qrColorLight}
                            onChange={(e) => setQrColorLight(e.target.value)}
                            className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case Converter Settings */}
                  {tool.id === 'case-converter' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Target Case Format
                      </label>
                      <select
                        value={caseType}
                        onChange={(e) => setCaseType(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                        <option value="title">Title Case (Every Word Capitalized)</option>
                        <option value="sentence">Sentence case</option>
                        <option value="camel">camelCase</option>
                        <option value="snake">snake_case</option>
                        <option value="kebab">kebab-case</option>
                        <option value="constant">CONSTANT_CASE</option>
                      </select>
                    </div>
                  )}

                  {/* Text Cleaner Settings */}
                  {tool.id === 'text-cleaner' && (
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cleanOptions.removeDuplicateLines}
                          onChange={(e) => setCleanOptions({ ...cleanOptions, removeDuplicateLines: e.target.checked })}
                          className="rounded accent-sky-500"
                        />
                        <span>Remove Duplicate Lines</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cleanOptions.trimLines}
                          onChange={(e) => setCleanOptions({ ...cleanOptions, trimLines: e.target.checked })}
                          className="rounded accent-sky-500"
                        />
                        <span>Trim Extra Whitespace</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cleanOptions.removeEmptyLines}
                          onChange={(e) => setCleanOptions({ ...cleanOptions, removeEmptyLines: e.target.checked })}
                          className="rounded accent-sky-500"
                        />
                        <span>Remove Empty Lines</span>
                      </label>
                    </div>
                  )}

                  {/* Text Reverser Settings */}
                  {tool.id === 'text-reverser' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Reversal Mode
                      </label>
                      <select
                        value={reverseMode}
                        onChange={(e) => setReverseMode(e.target.value as 'text' | 'words')}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="text">Reverse Characters</option>
                        <option value="words">Reverse Word Order</option>
                      </select>
                    </div>
                  )}

                  {/* JSON Formatter Settings */}
                  {tool.id === 'json-formatter' && (
                    <div className="text-xs">
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        JSON Indentation
                      </label>
                      <select
                        value={jsonIndentation}
                        onChange={(e) => setJsonIndentation(parseInt(e.target.value, 10))}
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      >
                        <option value="2">2 Spaces (Standard)</option>
                        <option value="4">4 Spaces</option>
                        <option value="0">Minified (Compact - 0 Spaces)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Spreadsheet Table Preview */}
              {spreadsheetPreview && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-500" />
                      Table Preview ({spreadsheetPreview.totalRows} rows)
                    </span>
                    <span className="text-[11px] text-slate-500">First 10 rows</span>
                  </div>
                  <div className="overflow-x-auto max-h-36 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="min-w-full text-[11px] text-left text-slate-700 dark:text-slate-300">
                      <thead className="bg-slate-200/70 dark:bg-slate-700 sticky top-0">
                        <tr>
                          {spreadsheetPreview.headers.map((h, i) => (
                            <th key={i} className="px-2 py-1.5 font-bold border-r border-slate-300 dark:border-slate-600">
                              {h || `Col ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {spreadsheetPreview.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-200 dark:border-slate-800">
                            {spreadsheetPreview.headers.map((_, cIdx) => (
                              <td key={cIdx} className="px-2 py-1 border-r border-slate-200 dark:border-slate-800">
                                {String(row[cIdx] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Apple Minimal Progress Bar */}
          {status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071E3] dark:text-[#0A84FF]" />
                  {t.converting}
                </span>
                <span className="font-apple-mono">{progress}%</span>
              </div>
              <div className="w-full bg-[#E5E5EA] dark:bg-[#38383A] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0071E3] dark:bg-[#0A84FF] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Apple Minimal Success Screen */}
          {status === 'success' && convertedResult && (
            <div className="p-6 rounded-[20px] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#D2D2D7] dark:border-[#38383A] space-y-4 animate-apple-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] text-base">
                    {t.statusDone}
                  </h4>
                  <p className="text-xs text-[#86868B] dark:text-[#98989D]">
                    {convertedResult.extraInfo || convertedResult.name}
                  </p>
                </div>
              </div>

              {/* Size Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.originalSize}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {formatSize(originalTotalSize)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">{t.convertedSize}</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono">
                    {formatSize(convertedResult.size)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[11px]">
                    {convertedResult.size <= originalTotalSize ? t.reduction : t.increase}
                  </span>
                  <span
                    className={`font-bold font-mono ${
                      convertedResult.size <= originalTotalSize ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {originalTotalSize > 0
                      ? `${Math.abs(Math.round(((originalTotalSize - convertedResult.size) / originalTotalSize) * 100))}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Text / Preview Output */}
              {convertedResult.previewText && (
                <div className="p-3 bg-slate-900/5 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {convertedResult.previewText}
                  </pre>
                </div>
              )}

              {/* Image Preview */}
              {convertedResult.previewUrl && (
                <div className="flex justify-center bg-slate-900/5 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={convertedResult.previewUrl}
                    alt="Converted preview"
                    className="max-h-48 rounded-lg object-contain shadow-sm"
                  />
                </div>
              )}

              {/* Extracted Files List */}
              {extractedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Unpacked Files ({extractedFiles.length})
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {extractedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400 font-mono">{formatSize(file.size)}</span>
                          <button
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = file.url;
                              a.download = file.name;
                              a.click();
                            }}
                            className="p-1 rounded text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-700"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apple Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => handleDownload(convertedResult)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-full bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] text-white font-medium text-xs sm:text-sm shadow-apple-sm transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.downloadBtn}</span>
                </button>
                <button
                  onClick={() => {
                    setFiles([]);
                    setConvertedResult(null);
                    setExtractedFiles([]);
                    setStatus('idle');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] hover:bg-[#D2D2D7] dark:hover:bg-[#48484A] text-[#1D1D1F] dark:text-[#F5F5F7] font-medium text-xs sm:text-sm transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.convertAnother}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Apple Window Footer Toolbar */}
        {status !== 'success' && (
          <div className="px-6 py-3.5 border-t border-[#D2D2D7]/80 dark:border-[#38383A]/80 bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-full text-[#86868B] dark:text-[#98989D] hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {t.cancelBtn}
            </button>
            <button
              disabled={
                (files.length === 0 &&
                  !(
                    isDirectInputTool &&
                    (textContent.trim().length > 0 ||
                      tool.id === 'unit-converter' ||
                      tool.id === 'color-picker' ||
                      tool.id === 'barcode-generator' ||
                      tool.id === 'qr-generator')
                  )) ||
                status === 'processing'
              }
              onClick={startConversion}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium text-xs sm:text-sm text-white transition-all shadow-apple-sm ${
                (files.length === 0 &&
                  !(
                    isDirectInputTool &&
                    (textContent.trim().length > 0 ||
                      tool.id === 'unit-converter' ||
                      tool.id === 'color-picker' ||
                      tool.id === 'barcode-generator' ||
                      tool.id === 'qr-generator')
                  )) ||
                status === 'processing'
                  ? 'bg-[#8E8E93] dark:bg-[#3A3A3C] cursor-not-allowed opacity-60'
                  : 'bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.converting}</span>
                </>
              ) : (
                <>
                  <span>{t.convertBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
