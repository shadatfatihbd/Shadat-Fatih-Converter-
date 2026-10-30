import React from 'react';
import { ConversionTool, Language } from '../types';
import { translations } from '../i18n/translations';
import {
  Files,
  Scissors,
  FileImage,
  RotateCw,
  Trash2,
  FileText,
  Image,
  Minimize2,
  Maximize2,
  FileCode,
  Code,
  BookOpen,
  Sheet,
  Table,
  Columns,
  FileSpreadsheet,
  Braces,
  Presentation,
  Images,
  AudioWaveform,
  Music,
  Film,
  Sparkles,
  Archive,
  FolderArchive,
  ShieldCheck,
  Info,
  ChevronRight,
  Flame,
  FileEdit,
  ScanText,
  AppWindow,
  QrCode,
  Barcode,
  Calculator,
  Type,
  RotateCcw,
  Binary,
  Scale,
  Palette,
  Crop,
  Sliders,
  PenTool
} from 'lucide-react';

interface ToolGridProps {
  tools: ConversionTool[];
  language: Language;
  onSelectTool: (tool: ConversionTool) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ tools, language, onSelectTool }) => {
  const t = translations[language];

  // Apple minimal line icons with stroke 1.5
  const getIcon = (iconName: string) => {
    const iconProps = { className: "w-5 h-5 text-[#1D1D1F] dark:text-[#F5F5F7]", strokeWidth: 1.5 };
    switch (iconName) {
      case 'Files': return <Files {...iconProps} />;
      case 'Scissors': return <Scissors {...iconProps} />;
      case 'FileImage': return <FileImage {...iconProps} />;
      case 'Stamp': return <FileText {...iconProps} />;
      case 'Hash': return <FileCode {...iconProps} />;
      case 'RotateCw': return <RotateCw {...iconProps} />;
      case 'Trash2': return <Trash2 {...iconProps} />;
      case 'FileText': return <FileText {...iconProps} />;
      case 'FileEdit': return <FileEdit {...iconProps} />;
      case 'ScanText': return <ScanText {...iconProps} />;
      case 'Image': return <Image {...iconProps} />;
      case 'AppWindow': return <AppWindow {...iconProps} />;
      case 'Vector': return <Sparkles {...iconProps} />;
      case 'Minimize2': return <Minimize2 {...iconProps} />;
      case 'Maximize2': return <Maximize2 {...iconProps} />;
      case 'Crop': return <Crop {...iconProps} />;
      case 'Sliders': return <Sliders {...iconProps} />;
      case 'PenTool': return <PenTool {...iconProps} />;
      case 'FileWord': return <FileText {...iconProps} />;
      case 'FileCode': return <FileCode {...iconProps} />;
      case 'Code': return <Code {...iconProps} />;
      case 'BookOpen': return <BookOpen {...iconProps} />;
      case 'Sheet': return <Sheet {...iconProps} />;
      case 'Table': return <Table {...iconProps} />;
      case 'Columns': return <Columns {...iconProps} />;
      case 'FileSpreadsheet': return <FileSpreadsheet {...iconProps} />;
      case 'Braces': return <Braces {...iconProps} />;
      case 'CodeXml': return <Code {...iconProps} />;
      case 'Presentation': return <Presentation {...iconProps} />;
      case 'Images': return <Images {...iconProps} />;
      case 'AudioWaveform': return <AudioWaveform {...iconProps} />;
      case 'Music': return <Music {...iconProps} />;
      case 'Film': return <Film {...iconProps} />;
      case 'Sparkles': return <Sparkles {...iconProps} />;
      case 'Archive': return <Archive {...iconProps} />;
      case 'FolderArchive': return <FolderArchive {...iconProps} />;
      case 'QrCode': return <QrCode {...iconProps} />;
      case 'Barcode': return <Barcode {...iconProps} />;
      case 'Calculator': return <Calculator {...iconProps} />;
      case 'Type': return <Type {...iconProps} />;
      case 'RotateCcw': return <RotateCcw {...iconProps} />;
      case 'Binary': return <Binary {...iconProps} />;
      case 'Scale': return <Scale {...iconProps} />;
      case 'Palette': return <Palette {...iconProps} />;
      case 'ShieldCheck': return <ShieldCheck {...iconProps} />;
      case 'Info': return <Info {...iconProps} />;
      default: return <Files {...iconProps} />;
    }
  };

  if (tools.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-[#1C1C1E] rounded-[20px] border border-[#D2D2D7] dark:border-[#38383A] max-w-md mx-auto">
        <p className="text-[#86868B] dark:text-[#98989D] text-sm">
          {language === 'bn'
            ? 'কোনো টুল খুঁজে পাওয়া যায়নি। অন্য কিওয়ার্ড চেষ্টা করুন।'
            : 'No tools match your query. Try different keywords or clear filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {tools.map((tool) => {
        const title = t[tool.nameKey] || tool.id;
        const desc = t[tool.descKey] || '';

        return (
          <div
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            className="group relative flex flex-col justify-between p-6 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-card hover:shadow-apple-card-hover hover:border-[#0071E3]/50 dark:hover:border-[#0A84FF]/50 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
          >
            <div>
              {/* Header inside card: squircle icon + popular badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center border border-[#E5E5EA] dark:border-[#38383A] transition-colors group-hover:bg-[#E5E5EA] dark:group-hover:bg-[#3A3A3C]">
                  {getIcon(tool.iconName)}
                </div>
                {tool.popular && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    <Flame className="w-3 h-3 text-[#FF9500] fill-[#FF9500]" />
                    <span>{t.popularBadge}</span>
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors">
                {title}
              </h3>
              <p className="mt-1.5 text-xs text-[#86868B] dark:text-[#98989D] line-clamp-2 leading-relaxed">
                {desc}
              </p>
            </div>

            {/* Footer inside card: extension pills + chevron */}
            <div className="mt-5 pt-3.5 border-t border-[#F2F2F7] dark:border-[#2C2C2E] flex items-center justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                {tool.outputExtensions.slice(0, 3).map((ext) => (
                  <span
                    key={ext}
                    className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#98989D] font-apple-mono"
                  >
                    {ext.replace('.', '')}
                  </span>
                ))}
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#86868B] dark:text-[#98989D] group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
