import React from 'react';
import { Language, ToolCategory } from '../types';
import { translations } from '../i18n/translations';
import { Search, ArrowRight, ShieldCheck, Check, Sparkles, FileText, ArrowLeftRight } from 'lucide-react';

interface HeroProps {
  language: Language;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ToolCategory;
  onSelectCategory: (cat: ToolCategory) => void;
}

export const Hero: React.FC<HeroProps> = ({
  language,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory
}) => {
  const t = translations[language];

  const categories: { id: ToolCategory; label: string }[] = [
    { id: 'all', label: t.catAll },
    { id: 'pdf', label: t.catPdf },
    { id: 'image', label: t.catImage },
    { id: 'document', label: t.catDoc },
    { id: 'spreadsheet', label: t.catSpreadsheet },
    { id: 'presentation', label: t.catPresentation },
    { id: 'audio', label: t.catAudio },
    { id: 'video', label: t.catVideo },
    { id: 'archive', label: t.catArchive },
    { id: 'qr-barcode', label: t.catQrBarcode || 'QR & Barcode' },
    { id: 'text', label: t.catText || 'Text' },
    { id: 'utility', label: t.catUtility }
  ];

  const scrollToAllTools = () => {
    const el = document.getElementById('all-tools-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-12 pb-14 sm:pt-16 sm:pb-20 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Apple Overline Label */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E5EA]/70 dark:bg-[#2C2C2E]/70 text-[#0071E3] dark:text-[#0A84FF] text-[11px] font-semibold tracking-wider uppercase mb-5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {language === 'bn' ? 'অল-ইন-ওয়ান ফাইল ইউটিলিটি' : 'ALL-IN-ONE FILE UTILITIES'}
          </span>
        </div>

        {/* Editorial Apple Headline */}
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] leading-[1.08] font-apple-display">
          {language === 'bn' ? (
            <>
              আপনার প্রয়োজনীয় সবকিছু।
              <br />
              <span className="text-[#86868B] dark:text-[#98989D]">একটি সহজ ওয়ার্কস্পেস।</span>
            </>
          ) : (
            <>
              Everything you need.
              <br />
              <span className="text-[#86868B] dark:text-[#98989D]">One simple workspace.</span>
            </>
          )}
        </h1>

        {/* Apple Sub-headline */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#86868B] dark:text-[#98989D] max-w-2xl mx-auto font-normal leading-relaxed">
          {language === 'bn'
            ? 'সহজ ও পরিচ্ছন্ন অভিজ্ঞতায় আপনার ফাইল কনভার্ট, কম্প্রেস, রিসাইজ এবং পরিচালনা করুন।'
            : 'Convert, compress, resize, and manage your files with a beautifully simple experience.'}
        </p>

        {/* Apple Call-To-Action Pill Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={scrollToAllTools}
            className="px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] text-white text-xs sm:text-sm font-medium transition-all shadow-apple-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{language === 'bn' ? 'সব টুলস এক্সপ্লোর করুন' : 'Explore All Tools'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onSelectCategory('pdf');
              scrollToAllTools();
            }}
            className="px-6 py-2.5 rounded-full bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7] border border-[#D2D2D7] dark:border-[#38383A] text-xs sm:text-sm font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition-all"
          >
            {language === 'bn' ? 'জনপ্রিয় টুলস' : 'Popular Tools'}
          </button>
        </div>

        {/* Apple Refined Search Bar */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="relative flex items-center bg-white dark:bg-[#1C1C1E] rounded-full border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-sm px-4 py-2.5 transition-all focus-within:border-[#0071E3] dark:focus-within:border-[#0A84FF] focus-within:ring-2 focus-within:ring-[#0071E3]/20">
            <Search className="w-4 h-4 text-[#86868B] dark:text-[#98989D] mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-transparent text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] dark:placeholder-[#98989D] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] px-2 py-0.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Apple Segmented Horizontal Category Nav */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] max-w-3xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-apple-sm'
                  : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sleek Apple Workspace Preview Card */}
        <div className="mt-12 max-w-2xl mx-auto rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-card overflow-hidden text-left">
          {/* macOS Title Bar */}
          <div className="px-4 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border-b border-[#D2D2D7]/80 dark:border-[#38383A]/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
            </div>
            <span className="text-[11px] font-medium text-[#86868B] dark:text-[#98989D] font-apple-text">
              SFC Workspace Preview
            </span>
            <div className="w-10" />
          </div>

          {/* macOS App Preview Body */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E] flex items-center justify-center text-[#0071E3] dark:text-[#0A84FF]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5">
                    <span>Quarterly_Report_2026.pdf</span>
                    <ArrowLeftRight className="w-3 h-3 text-[#86868B]" />
                    <span className="text-[#0071E3] dark:text-[#0A84FF]">DOCX</span>
                  </div>
                  <div className="text-[11px] text-[#86868B] dark:text-[#98989D] font-apple-mono">
                    2.4 MB • 100% Client-Side Engine
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#34C759] text-[10px] font-semibold">
                <Check className="w-3 h-3" />
                <span>Ready</span>
              </div>
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full bg-[#E5E5EA] dark:bg-[#38383A] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0071E3] dark:bg-[#0A84FF] h-full w-full rounded-full" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#98989D] pt-1 border-t border-[#D2D2D7]/50 dark:border-[#38383A]/50">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#0071E3] dark:text-[#0A84FF]" />
                Zero cloud latency • Instant browser export
              </span>
              <span className="font-apple-mono">100% processed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
