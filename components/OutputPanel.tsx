import React, { useState, useEffect, useMemo } from 'react';
import { AppStatus } from '../types';
import { CopyIcon, CheckIcon, AlertTriangleIcon } from './Icons';
import { marked } from 'marked';

interface OutputPanelProps {
  formattedText: string;
  status: AppStatus;
  error: string | null;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ formattedText, status, error }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = () => {
    if (formattedText) {
      navigator.clipboard.writeText(formattedText);
      setIsCopied(true);
    }
  };
  
  const htmlContent = useMemo(() => {
    if (status === AppStatus.SUCCESS && formattedText) {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
        return marked.parse(formattedText) as string;
    }
    return '';
  }, [formattedText, status]);

  const renderContent = () => {
    switch (status) {
      case AppStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium">AI가 요구사항을 분석하고 있습니다...</p>
            <p className="text-sm">잠시만 기다려주세요.</p>
          </div>
        );
      case AppStatus.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-full text-red-600 p-4">
            <AlertTriangleIcon className="h-12 w-12 mb-4" />
            <p className="text-lg font-bold">오류 발생</p>
            <p className="text-center mt-2">{error}</p>
          </div>
        );
      case AppStatus.SUCCESS:
        return (
          <div 
            className="prose prose-sm sm:prose-base lg:prose-lg max-w-none w-full h-full overflow-auto" 
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );
      case AppStatus.IDLE:
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>정리된 요구사항이 여기에 표시됩니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">정리된 결과</h2>
        {status === AppStatus.SUCCESS && formattedText && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-all duration-200"
          >
            {isCopied ? (
              <>
                <CheckIcon className="-ml-1 mr-2 h-5 w-5 text-green-500" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <CopyIcon className="-ml-1 mr-2 h-5 w-5" />
                <span>원본 복사</span>
              </>
            )}
          </button>
        )}
      </div>
      <div className="flex-grow bg-neutral-light rounded-md p-4 min-h-[300px] lg:min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};