import React, { useState, useEffect } from 'react';
import { Video, Sparkles, RefreshCw, PlusCircle, AlertCircle, Play, Settings2 } from 'lucide-react';
import UploadZone from './components/UploadZone';
import ResultCard from './components/ResultCard';
import StoryboardView from './components/StoryboardView';
import { extractFrames, generateSampleTimestamps } from './utils/videoUtils';
import { analyzeFrame, generateStoryboard } from './services/geminiService';
import { AnalysisResult, AppState, AnalysisData } from './types';

// Use a unique ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [frameCount, setFrameCount] = useState<number>(8);
  
  // Storyboard states
  const [storyboard, setStoryboard] = useState<string | null>(null);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileSelect = async (selectedFile: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setVideoUrl(url);
    setResults([]);
    setStoryboard(null);
    setAppState(AppState.IDLE);
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setVideoDuration(e.currentTarget.duration);
    setVideoRef(e.currentTarget);
  };

  const startAnalysis = async () => {
    if (!file) return;

    setAppState(AppState.ANALYZING);
    setStoryboard(null);
    setIsGeneratingStoryboard(false);
    
    try {
      // 1. Determine Timestamps based on user selection
      const timestamps = generateSampleTimestamps(videoDuration, frameCount);

      // 2. Create placeholders in UI
      const initialResults: AnalysisResult[] = timestamps.map(t => ({
        id: generateId(),
        timestamp: t,
        thumbnail: '', // will fill later
        isLoading: true,
      }));
      setResults(initialResults);

      // 3. Extract Frames
      const frames = await extractFrames(file, timestamps);

      // Update placeholders with real thumbnails
      setResults(prev => prev.map(item => {
        const frame = frames.find(f => f.timestamp === item.timestamp);
        return frame ? { ...item, thumbnail: frame.image } : item;
      }));

      // Maintain a local copy of completed results for storyboard generation
      const completedResults: AnalysisResult[] = [];

      // 4. Analyze each frame sequentially to avoid rate limits
      for (const frame of frames) {
        try {
          const data = await analyzeFrame(frame.image);
          
          // Store successful result
          const resultItem: AnalysisResult = { 
            id: initialResults.find(r => r.timestamp === frame.timestamp)?.id || generateId(),
            timestamp: frame.timestamp,
            thumbnail: frame.image,
            isLoading: false,
            data 
          };
          completedResults.push(resultItem);

          setResults(prev => prev.map(item => 
            item.timestamp === frame.timestamp 
              ? resultItem
              : item
          ));
        } catch (err) {
          setResults(prev => prev.map(item => 
            item.timestamp === frame.timestamp 
              ? { ...item, isLoading: false, error: "分析帧失败" } 
              : item
          ));
        }
      }

      setAppState(AppState.COMPLETE);

      // 5. Generate Storyboard if we have valid results
      if (completedResults.length > 0) {
        setIsGeneratingStoryboard(true);
        try {
          const script = await generateStoryboard(completedResults);
          setStoryboard(script);
        } catch (e) {
          console.error("Failed to generate storyboard", e);
        } finally {
          setIsGeneratingStoryboard(false);
        }
      }

    } catch (error) {
      console.error("Analysis sequence failed", error);
      setAppState(AppState.IDLE);
      alert("视频处理失败，请重试。");
    }
  };

  const analyzeCurrentFrame = async () => {
    if (!videoRef || !videoRef.currentTime || appState === AppState.ANALYZING) return;

    const currentTime = videoRef.currentTime;
    const tempId = generateId();

    // Create canvas to capture current frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.videoWidth / 2;
    canvas.height = videoRef.videoHeight / 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/png');

    // Add loading card
    const newResult: AnalysisResult = {
        id: tempId,
        timestamp: currentTime,
        thumbnail: base64,
        isLoading: true,
    };

    // Add to start of list
    setResults(prev => [newResult, ...prev]);

    try {
        const data = await analyzeFrame(base64);
        setResults(prev => prev.map(r => r.id === tempId ? { ...r, isLoading: false, data } : r));
    } catch (e) {
        setResults(prev => prev.map(r => r.id === tempId ? { ...r, isLoading: false, error: "分析失败" } : r));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Video className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              视频逆向 <span className="text-blue-400">AI</span>
            </h1>
          </div>
          <div className="flex gap-4">
             {!process.env.API_KEY && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/50 rounded-full text-yellow-400 text-xs font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>缺少 API Key</span>
                 </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Initial Upload State */}
        {!videoUrl && (
           <div className="mt-12 space-y-8">
             <div className="text-center max-w-2xl mx-auto space-y-4">
                <h2 className="text-4xl font-bold text-white">
                  使用 Gemini 2.5 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">逆向解析</span> 任意视频
                </h2>
                <p className="text-slate-400 text-lg">
                  上传视频自动提取关键帧，生成 AI 绘画提示词 (Midjourney/SD)，并深度拆解镜头制作背后的技术细节。
                </p>
             </div>
             <UploadZone onFileSelected={handleFileSelect} isProcessing={false} />
             
             {/* Features Grid */}
             <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
                {[
                    { icon: Sparkles, title: "AI 提示词生成", desc: "获取还原画风的精准提示词" },
                    { icon: Video, title: "镜头技术拆解", desc: "解析灯光、运镜与特效技术" },
                    { icon: RefreshCw, title: "逐帧深度分析", desc: "精准捕捉每一个关键瞬间" }
                ].map((f, i) => (
                    <div key={i} className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center">
                        <f.icon className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                        <h3 className="font-semibold text-slate-200">{f.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
                    </div>
                ))}
             </div>
           </div>
        )}

        {/* Analysis Interface */}
        {videoUrl && (
          <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left Column: Player & Controls */}
            <div className="lg:col-span-7 space-y-6">
                <div className="sticky top-24">
                    {/* Video Player */}
                    <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl shadow-black/50 aspect-video border border-slate-800 ring-1 ring-slate-700/50">
                        <video 
                            src={videoUrl} 
                            className="w-full h-full object-contain"
                            controls
                            autoPlay
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800 mt-4 gap-4">
                        <button 
                            onClick={analyzeCurrentFrame}
                            disabled={appState === AppState.ANALYZING}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlusCircle className="w-4 h-4" />
                            分析当前帧
                        </button>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            {/* Frame Count Selector */}
                            <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg border border-slate-700/50">
                                <Settings2 className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-400 whitespace-nowrap">帧数</span>
                                <select 
                                    value={frameCount}
                                    onChange={(e) => setFrameCount(Number(e.target.value))}
                                    disabled={appState === AppState.ANALYZING}
                                    className="bg-transparent text-sm font-medium text-blue-400 focus:outline-none cursor-pointer"
                                >
                                    <option value={8}>8 帧</option>
                                    <option value={12}>12 帧</option>
                                    <option value={16}>16 帧</option>
                                    <option value={20}>20 帧</option>
                                    <option value={24}>24 帧</option>
                                </select>
                            </div>

                            <button 
                                onClick={startAnalysis}
                                disabled={appState === AppState.ANALYZING}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                                {appState === AppState.ANALYZING ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        分析中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        开始分析
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {file && (
                         <div className="mt-4 flex items-center justify-between text-xs text-slate-500 px-1">
                             <p>视频源: {file.name}</p>
                             <button onClick={() => { setVideoUrl(null); setFile(null); }} className="hover:text-red-400 transition-colors">
                                 移除视频
                             </button>
                         </div>
                    )}
                </div>
            </div>

            {/* Right Column: Results Stream */}
            <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        分析记录
                        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                            {results.length}
                        </span>
                    </h3>
                </div>

                {/* Storyboard Section */}
                <StoryboardView content={storyboard} isLoading={isGeneratingStoryboard} />

                <div className="space-y-4 min-h-[200px] pb-20">
                    {results.length === 0 && !isGeneratingStoryboard && (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                            <Play className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm">请开始分析或手动截取画面</p>
                        </div>
                    )}
                    
                    {results.map((result) => (
                        <ResultCard key={result.id} result={result} />
                    ))}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;