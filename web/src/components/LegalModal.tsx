import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { X, Shield, FileText, Info } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'about' | null;
  language: Language;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, language, onClose }) => {
  if (!type) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto animate-apple-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-[24px] border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-window dark:shadow-apple-dark-window p-6 sm:p-8 my-auto max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {type === 'about' && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mb-3">
              <Info className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              About SFC Shadat Fatih Converter
            </h2>
            <div className="text-xs sm:text-sm text-[#86868B] dark:text-[#98989D] space-y-3 leading-relaxed">
              <p>
                <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">SFC Shadat Fatih Converter</strong> (abbreviated as SFC) is a modern, high-performance, and privacy-respecting file transformation platform designed and developed by <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Shadat Fatih</strong>.
              </p>
              <p>
                Unlike conventional online file converters that transmit your confidential files over the internet to remote cloud servers, SFC performs data conversions <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">locally inside your web browser</strong> utilizing modern HTML5 APIs, WebAssembly, SheetJS, JSZip, and pdf-lib.
              </p>
              <p className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Key Principles:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Privacy First:</strong> Your documents, photos, audio tracks, and spreadsheets never leave your device.</li>
                <li><strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Zero Cost:</strong> No subscription paywalls, watermarks, or artificial limits.</li>
                <li><strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Apple Aesthetic:</strong> Minimalist, intuitive typography, generous whitespace, and focused interactions.</li>
                <li><strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Bilingual:</strong> Complete English and Bengali localization.</li>
              </ul>
            </div>
          </div>
        )}

        {type === 'privacy' && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mb-3">
              <Shield className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              {t.navPrivacy}
            </h2>
            <div className="text-xs sm:text-sm text-[#86868B] dark:text-[#98989D] space-y-3 leading-relaxed">
              <p>
                At <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">SFC Shadat Fatih Converter</strong>, safeguarding your privacy is the cornerstone of our architecture.
              </p>
              <h4 className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] text-xs uppercase tracking-wider">
                1. Local On-Device Processing
              </h4>
              <p className="text-xs">
                When you drag and drop or select files in SFC, they are read exclusively into your web browser's local sandbox memory. No file data is uploaded to any remote server.
              </p>
              <h4 className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] text-xs uppercase tracking-wider">
                2. No Data Collection or Retention
              </h4>
              <p className="text-xs">
                We do not track, catalog, store, or sell file names, file contents, metadata, or user personal records. As soon as you refresh or close your browser tab, all temporary memory objects are cleared.
              </p>
            </div>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              {t.navTerms}
            </h2>
            <div className="text-xs sm:text-sm text-[#86868B] dark:text-[#98989D] space-y-3 leading-relaxed">
              <p>
                By accessing and using SFC Shadat Fatih Converter, you agree to these fair usage terms.
              </p>
              <p className="text-xs">
                1. <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Free & As-Is Usage:</strong> SFC is provided free of charge for personal, educational, and professional use on an &ldquo;as-is&rdquo; basis.
              </p>
              <p className="text-xs">
                2. <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Intellectual Property:</strong> You retain complete ownership and rights to all files you convert using SFC. SFC claims zero rights over your content.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#D2D2D7]/70 dark:border-[#38383A]/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] hover:bg-[#D2D2D7] dark:hover:bg-[#3A3A3C] text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
