import React from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface StoryboardViewProps {
  content: string | null;
  isLoading: boolean;
}

const StoryboardView: React.FC<StoryboardViewProps> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/50 rounded-xl p-6 border border-slate-800 mb-6">
        <div className="flex items-center gap-3 mb-4 text-purple-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-semibold text-sm">正在生成分镜脚本...</span>
        </div>
        <div className="space-y-3 animate-pulse">
           <div className="h-4 bg-slate-800 rounded w-full"></div>
           <div className="h-4 bg-slate-800 rounded w-5/6"></div>
           <div className="h-4 bg-slate-800 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="w-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden mb-6 shadow-lg shadow-black/20">
       <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 rounded-md">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-semibold text-slate-200">AI 分镜脚本</h3>
       </div>
       <div className="p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
          {content}
       </div>
    </div>
  );
};

export default StoryboardView;