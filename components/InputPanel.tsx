import React, { useCallback, useRef, useState } from 'react';
import { AppStatus } from '../types';
import { MagicWandIcon, TrashIcon, SpinnerIcon, UploadIcon, XCircleIcon } from './Icons';

interface InputPanelProps {
  rawText: string;
  setRawText: (text: string | ((prev: string) => string)) => void;
  files: File[];
  setFiles: (files: File[] | ((prev: File[]) => File[])) => void;
  onFormat: () => void;
  onClear: () => void;
  status: AppStatus;
}

const ALLOWED_BINARY_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ALLOWED_TEXT_TYPES = ['text/plain', 'text/markdown'];
const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.pdf',
    '.doc', '.docx',
    '.ppt', '.pptx',
    '.hwp',
    '.txt', '.md',
];


export const InputPanel: React.FC<InputPanelProps> = ({ rawText, setRawText, files, setFiles, onFormat, onClear, status }) => {
  const isLoading = status === AppStatus.LOADING;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = useCallback((droppedFiles: FileList) => {
    const allFiles = Array.from(droppedFiles);
    const binaryFiles = allFiles.filter(file => 
        ALLOWED_BINARY_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.hwp')
    );
    const textFiles = allFiles.filter(file => ALLOWED_TEXT_TYPES.includes(file.type));

    setFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const newFiles = binaryFiles.filter(f => !existingNames.has(f.name));
        return [...prev, ...newFiles];
    });

    textFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(prev => prev ? `${prev}\n\n--- (${file.name} 파일 내용) ---\n${text}` : text);
      };
      reader.readAsText(file);
    });
  }, [setFiles, setRawText]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(e.target.files);
      e.target.value = ''; // Reset for same file selection
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">원본 요구사항</h2>
      
      <div 
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`relative flex flex-col flex-grow border-2 border-dashed rounded-md transition-colors duration-200 ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
      >
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="여기에 정리되지 않은 요구사항, 아이디어, 회의록 등을 붙여넣거나 파일을 드래그 앤 드롭 하세요..."
          className="w-full flex-grow p-4 bg-transparent border-none rounded-md focus:ring-0 focus:outline-none resize-none"
          rows={10}
          disabled={isLoading}
        />
         {files.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-2">첨부된 파일 ({files.length}개)</h3>
            <ul className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <li key={index} className="relative group bg-gray-100 rounded-md p-1 pr-6 text-xs text-gray-700">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(index)} className="absolute top-1/2 right-0 transform -translate-y-1/2 text-gray-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity">
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="hidden"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
      />

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onFormat}
          disabled={isLoading || (!rawText.trim() && files.length === 0)}
          className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              <span>정리 중...</span>
            </>
          ) : (
            <>
              <MagicWandIcon className="-ml-1 mr-2 h-5 w-5" />
              <span>AI로 포맷하기</span>
            </>
          )}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors duration-200"
        >
          <UploadIcon className="-ml-1 mr-2 h-5 w-5" />
          <span>파일 선택</span>
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-colors duration-200"
        >
          <TrashIcon className="-ml-1 mr-2 h-5 w-5" />
          <span>초기화</span>
        </button>
      </div>
    </div>
  );
};