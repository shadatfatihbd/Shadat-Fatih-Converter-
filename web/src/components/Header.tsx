import React, { useState } from 'react';
import { Language, Theme, ToolCategory } from '../types';
import { translations } from '../i18n/translations';
import { Sun, Moon, Menu, X, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
  selectedCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
  onOpenLegal: (type: 'privacy' | 'terms' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  selectedCategory,
  onSelectCategory,
  onOpenLegal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const navCategories: { id: ToolCategory; label: string }[] = [
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

  return (
    <header className="sticky top-0 z-40 w-full apple-glass border-b border-[#D2D2D7]/70 dark:border-[#38383A]/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* SFC Apple Minimal Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => {
              onSelectCategory('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {/* Apple-style squircle monogram */}
            <div className="w-9 h-9 rounded-[10px] bg-[#1D1D1F] dark:bg-[#2C2C2E] flex items-center justify-center text-white border border-[#D2D2D7]/40 dark:border-white/10 shadow-apple-sm group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path d="M7 8h10M7 12h7M7 16h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm sm:text-base tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                  SFC
                </span>
                <span className="text-[#86868B] dark:text-[#98989D] text-xs hidden sm:inline font-normal">
                  / Shadat Fatih Converter
                </span>
              </div>
              <div className="text-[10px] text-[#86868B] dark:text-[#98989D] flex items-center gap-1 font-medium -mt-0.5">
                <ShieldCheck className="w-3 h-3 text-[#0071E3] dark:text-[#0A84FF]" />
                <span>On-Device Privacy</span>
              </div>
            </div>
          </div>

          {/* Desktop Categories Segmented Scrollbar */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1 max-w-2xl px-2">
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#1D1D1F] text-white dark:bg-[#F5F5F7] dark:text-[#1D1D1F] shadow-apple-sm'
                    : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Controls: Segmented Language, Theme Toggle, About */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Apple Segmented Language Switcher */}
            <div className="flex items-center p-0.5 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] border border-[#D2D2D7]/50 dark:border-[#38383A]/50 text-xs">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
                  language === 'en'
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-apple-sm'
                    : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('bn')}
                className={`px-2.5 py-0.5 rounded-full font-medium transition-all ${
                  language === 'bn'
                    ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-apple-sm'
                    : 'text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Apple Theme Switch Button */}
            <button
              onClick={onThemeToggle}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] transition"
              title="Toggle Appearance"
              aria-label="Theme toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F5F5F7]" />
              ) : (
                <Moon className="w-4 h-4 text-[#1D1D1F]" />
              )}
            </button>

            {/* Minimal About Link */}
            <button
              onClick={() => onOpenLegal('about')}
              className="hidden md:inline-flex px-3 py-1 text-xs font-medium rounded-full text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {t.navAbout}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-full text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#D2D2D7]/70 dark:border-[#38383A]/70 apple-glass px-4 pt-3 pb-6 space-y-3 animate-apple-in">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#98989D] px-1">
            {t.allToolsTitle}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 text-xs font-medium rounded-xl transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#0071E3] dark:bg-[#0A84FF] text-white font-semibold'
                    : 'text-[#1D1D1F] dark:text-[#F5F5F7] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#D2D2D7]/70 dark:border-[#38383A]/70 flex justify-between text-xs text-[#86868B] dark:text-[#98989D] px-1">
            <button onClick={() => { onOpenLegal('about'); setMobileMenuOpen(false); }}>{t.navAbout}</button>
            <button onClick={() => { onOpenLegal('privacy'); setMobileMenuOpen(false); }}>{t.navPrivacy}</button>
            <button onClick={() => { onOpenLegal('terms'); setMobileMenuOpen(false); }}>{t.navTerms}</button>
          </div>
        </div>
      )}
    </header>
  );
};
