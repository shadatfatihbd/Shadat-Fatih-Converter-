import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  language: Language;
  onOpenLegal: (type: 'privacy' | 'terms' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onOpenLegal }) => {
  const t = translations[language];

  return (
    <footer className="mt-16 border-t border-[#D2D2D7] dark:border-[#38383A] bg-[#F5F5F7] dark:bg-[#000000] transition-colors py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[6px] bg-[#1D1D1F] dark:bg-[#2C2C2E] flex items-center justify-center text-white text-[10px] font-semibold">
                SFC
              </div>
              <span className="font-semibold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
                SFC Shadat Fatih Converter
              </span>
            </div>
            <p className="text-xs text-[#86868B] dark:text-[#98989D] leading-relaxed max-w-sm">
              {t.footerDesc}
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#86868B] dark:text-[#98989D]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
              <span>{t.privacyHeroNotice}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#98989D]">
              {t.footerQuickLinks}
            </h4>
            <ul className="space-y-2 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition"
                >
                  {t.navHome}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    const el = document.getElementById('all-tools-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition"
                >
                  {t.navAllTools}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('about')} className="hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition">
                  {t.navAbout}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#98989D]">
              {t.footerLegal}
            </h4>
            <ul className="space-y-2 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
              <li>
                <button onClick={() => onOpenLegal('privacy')} className="hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition">
                  {t.navPrivacy}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLegal('terms')} className="hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition">
                  {t.navTerms}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Apple Editorial Bottom Line */}
        <div className="mt-10 pt-6 border-t border-[#D2D2D7]/60 dark:border-[#38383A]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-[#86868B] dark:text-[#98989D] gap-3">
          <p>© {new Date().getFullYear()} SFC Shadat Fatih Converter. {t.allRights}</p>
          <p className="font-normal">
            Designed with simplicity in mind.
          </p>
        </div>
      </div>
    </footer>
  );
};
