import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { formatTime } from '../utils/videoUtils';
import { Copy, Aperture, Palette, Wand2, ChevronDown, ChevronUp, Loader2, User } from 'lucide-react';

interface ResultCardProps {
  result: AnalysisResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (result.isLoading) {
    return (
      <div className="w-full bg-slate-800/50 rounded-xl p-4 border border-slate-700 animate-pulse flex items-center gap-4">
        <div className="w-24 h-16 bg-slate-700 rounded-lg shrink-0"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-700 rounded w-1/4"></div>
            <div className="h-3 bg-slate-700/50 rounded w-3/4"></div>
        </div>
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (result.error) {
     return (
        <div className="w-full bg-red-900/20 rounded-xl p-4 border border-red-800 text-red-200">
            <p className="text-sm font-bold">错误发生于 {formatTime(result.timestamp)}</p>
            <p className="text-xs">{result.error}</p>
        </div>
     );
  }

  if (!result.data) return null;

  return (
    <div className="w-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-900/5">
      
      {/* Header Section */}
      <div 
        className="flex items-center p-4 cursor-pointer bg-slate-800/80 backdrop-blur-sm"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Thumbnail */}
        <div className="relative group shrink-0">
            <img 
                src={result.thumbnail} 
                alt={`Frame at ${result.timestamp}`} 
                className="w-32 h-20 object-cover rounded-lg border border-slate-600"
            />
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                {formatTime(result.timestamp)}
            </div>
        </div>

        {/* Preview Text */}
        <div className="flex-1 ml-4 min-w-0">
            <h4 className="text-sm font-medium text-blue-300 mb-1 flex items-center gap-2">
                <Wand2 className="w-3 h-3" />
                AI 提示词
            </h4>
            <p className="text-slate-300 text-sm truncate">
                {result.data.aiPrompt}
            </p>
        </div>

        {/* Expand Toggle */}
        <div className="ml-4 text-slate-500">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-6 bg-slate-800/50 border-t border-slate-700/50">
            
            {/* AI Prompt Section */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-purple-400" />
                        AI 绘画提示词 (Scene)
                    </h5>
                    <button 
                        onClick={() => result.data && copyToClipboard(result.data.aiPrompt, 'prompt')}
                        className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        <Copy className="w-3 h-3" />
                        {copiedSection === 'prompt' ? '已复制!' : '复制'}
                    </button>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg text-sm text-slate-200 font-mono border border-slate-700/50">
                    {result.data.aiPrompt}
                </div>
            </div>

            {/* Character Prompt Section (Conditional) */}
            {result.data.characterPrompt && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs font-bold uppercase text-slate-400 flex items-center gap-2">
                            <User className="w-4 h-4 text-orange-400" />
                            人物角色提示词 (Character)
                        </h5>
                        <button 
                            onClick={() => result.data?.characterPrompt && copyToClipboard(result.data.characterPrompt, 'char-prompt')}
                            className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <Copy className="w-3 h-3" />
                            {copiedSection === 'char-prompt' ? '已复制!' : '复制'}
                        </button>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg text-sm text-orange-100/90 font-mono border border-orange-900/30">
                        {result.data.characterPrompt}
                    </div>
                </div>
            )}

            {/* Grid for Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Technical Breakdown */}
                <div>
                    <h5 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                        <Aperture className="w-4 h-4 text-emerald-400" />
                        技术制作解析
                    </h5>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {result.data.technicalBreakdown}
                    </p>
                </div>

                {/* Visual Description */}
                <div>
                     <h5 className="text-xs font-bold uppercase text-slate-400 mb-2">
                        视觉画面描述
                    </h5>
                     <p className="text-sm text-slate-400 leading-relaxed">
                        {result.data.visualDescription}
                    </p>

                    {/* Color Palette */}
                    <div className="mt-4">
                        <h5 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-pink-400" />
                            核心配色
                        </h5>
                        <div className="flex gap-2">
                            {result.data.colorPalette.map((color, idx) => (
                                <div key={idx} className="group relative">
                                    <div 
                                        className="w-8 h-8 rounded-full shadow-lg border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                        onClick={() => copyToClipboard(color, `color-${idx}`)}
                                    ></div>
                                    {copiedSection === `color-${idx}` && (
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-black text-white px-2 py-1 rounded">
                                            已复制
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;