import React, { useRef, useState } from 'react';
import { Upload, Film, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
      if (file.type.startsWith('video/')) {
          onFileSelected(file);
      } else {
          alert("请上传有效的视频文件。");
      }
  };

  return (
    <div
      className={`
        relative w-full max-w-2xl mx-auto h-64 rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out flex flex-col items-center justify-center cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}
        ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="video/*"
        onChange={handleInputChange}
      />
      
      {isProcessing ? (
        <div className="flex flex-col items-center text-blue-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-lg font-medium">视频处理中...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-slate-400 group-hover:text-slate-200 transition-colors">
            <div className="p-4 rounded-full bg-slate-800 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">上传视频</h3>
            <p className="text-sm text-slate-500">拖拽或点击上传 (支持 MP4, MOV, WebM)</p>
        </div>
      )}
    </div>
  );
};

export default UploadZone;