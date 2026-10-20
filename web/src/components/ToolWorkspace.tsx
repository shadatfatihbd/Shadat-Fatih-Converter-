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
  updatePdfMetadata
} from '../engines/pdfEngine';
import { processImage } from '../engines/imageEngine';
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

  // Allow multiple file select for batch tools
  const allowsMultiple =
    tool.id === 'pdf-merge' || tool.id === 'img-to-pdf' || tool.id === 'zip-create';

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
    if (files.length === 0) {
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
          setProgress(50);
          result = await processImage(files[0], imageSettings);
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

        // Utility Tools
        case 'file-checksum':
          setProgress(50);
          result = await calculateChecksums(files[0]);
          break;
        case 'file-metadata':
          setProgress(50);
          result = await inspectFileMetadata(files[0]);
          break;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t[tool.nameKey] || tool.id}</span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {tool.category}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t[tool.descKey]}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* File Upload Zone */}
          {files.length === 0 ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={allowsMultiple}
                accept={tool.inputExtensions.includes('*') ? undefined : tool.inputExtensions.join(',')}
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                {t.dropTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t.dropSubtitle}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                <span>Supported: {tool.inputExtensions.join(', ')}</span>
                <span>•</span>
                <span>Max: {tool.maxFileSizeMB} MB</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Selected Files ({files.length})
                </span>
                <button
                  onClick={() => {
                    setFiles([]);
                    setConvertedResult(null);
                    setExtractedFiles([]);
                    setStatus('idle');
                  }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.resetBtn}
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileCheck className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs font-mono shrink-0 ml-2">
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

          {/* Progress Bar */}
          {status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                  {t.converting}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Screen */}
          {status === 'success' && convertedResult && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 space-y-5 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {t.statusDone}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleDownload(convertedResult)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
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
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.convertAnother}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {status !== 'success' && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {t.cancelBtn}
            </button>
            <button
              disabled={files.length === 0 || status === 'processing'}
              onClick={startConversion}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-md ${
                files.length === 0 || status === 'processing'
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-sky-500/25 hover:scale-105'
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
