import React from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { ShieldCheck, HardDrive, Cpu, CheckCircle } from 'lucide-react';

interface PrivacyNoticeProps {
  language: Language;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ language }) => {
  const t = translations[language];

  return (
    <section className="my-16 p-8 sm:p-12 rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-card text-center">
      <div className="max-w-3xl mx-auto">
        {/* Apple Privacy Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-medium mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
          <span>{language === 'bn' ? 'প্রাইভেসির নিশ্চয়তা' : 'Built for Privacy'}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight font-apple-display">
          {language === 'bn' ? 'প্রাইভেসি সবার আগে। ফাইল আপনার ডিভাইসেই থাকে।' : 'Privacy first. Files never leave your device.'}
        </h2>
        <p className="mt-2.5 text-xs sm:text-sm text-[#86868B] dark:text-[#98989D] max-w-xl mx-auto leading-relaxed">
          {t.privacyDesc}
        </p>

        {/* 3 Apple Pillar Columns */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="p-5 rounded-[18px] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A]">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#3A3A3C] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mb-3 shadow-apple-sm">
              <Cpu className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.privacyPoint1Title}
            </h3>
            <p className="mt-1.5 text-xs text-[#86868B] dark:text-[#98989D] leading-relaxed">
              {t.privacyPoint1Desc}
            </p>
          </div>

          <div className="p-5 rounded-[18px] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A]">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#3A3A3C] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mb-3 shadow-apple-sm">
              <HardDrive className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.privacyPoint2Title}
            </h3>
            <p className="mt-1.5 text-xs text-[#86868B] dark:text-[#98989D] leading-relaxed">
              {t.privacyPoint2Desc}
            </p>
          </div>

          <div className="p-5 rounded-[18px] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A]">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#3A3A3C] text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center mb-3 shadow-apple-sm">
              <CheckCircle className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">
              {t.privacyPoint3Title}
            </h3>
            <p className="mt-1.5 text-xs text-[#86868B] dark:text-[#98989D] leading-relaxed">
              {t.privacyPoint3Desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
