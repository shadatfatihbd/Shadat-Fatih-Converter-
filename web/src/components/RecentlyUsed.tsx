import React from 'react';
import { ConversionTool, Language } from '../types';
import { translations } from '../i18n/translations';
import { Clock, ChevronRight } from 'lucide-react';

interface RecentlyUsedProps {
  recentToolIds: string[];
  allTools: ConversionTool[];
  language: Language;
  onSelectTool: (tool: ConversionTool) => void;
  onClearHistory: () => void;
}

export const RecentlyUsed: React.FC<RecentlyUsedProps> = ({
  recentToolIds,
  allTools,
  language,
  onSelectTool,
  onClearHistory
}) => {
  const t = translations[language];

  const recentTools = recentToolIds
    .map((id) => allTools.find((tool) => tool.id === id))
    .filter((t): t is ConversionTool => Boolean(t));

  if (recentTools.length === 0) return null;

  return (
    <div className="mb-8 p-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-[#D2D2D7] dark:border-[#38383A] shadow-apple-card">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
          <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight uppercase">
            {t.recentToolsTitle}
          </h3>
        </div>
        <button
          onClick={onClearHistory}
          className="text-[11px] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition"
        >
          {t.clearRecent}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {recentTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] hover:border-[#0071E3]/50 dark:hover:border-[#0A84FF]/50 transition-all text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0"
          >
            <span>{t[tool.nameKey] || tool.id}</span>
            <ChevronRight className="w-3 h-3 text-[#86868B]" />
          </button>
        ))}
      </div>
    </div>
  );
};
