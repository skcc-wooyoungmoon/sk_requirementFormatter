import React, { useState, useEffect, useMemo } from 'react';
import { AppStatus, FormattedResult } from '../types';
import { CopyIcon, CheckIcon, AlertTriangleIcon, DownloadIcon } from './Icons';
import { marked } from 'marked';

interface OutputPanelProps {
  formattedResult: FormattedResult | null;
  status: AppStatus;
  error: string | null;
}

type Tab = 'view' | 'md' | 'html' | 'csv';

export const OutputPanel: React.FC<OutputPanelProps> = ({ formattedResult, status, error }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('view');

  const markdownContent = formattedResult?.markdownOutput || '';

  useEffect(() => {
    if (status === AppStatus.SUCCESS) {
      setActiveTab('view');
    }
  }, [status]);
  
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const htmlContent = useMemo(() => {
    if (markdownContent) {
      marked.setOptions({ breaks: true, gfm: true });
      return marked.parse(markdownContent) as string;
    }
    return '';
  }, [markdownContent]);

  const handleCopy = (contentToCopy: string) => {
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setIsCopied(true);
    }
  };

  const handleDownloadMd = () => {
    if (markdownContent) {
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'requirements.md');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadCsv = () => {
    if (!formattedResult || formattedResult.requirementsList.length === 0) return;
    
    const headers = ["요구사항 그룹", "요구사항 ID", "요구사항 순번", "상세내용"];
    const escapeCsvField = (field: any): string => {
        const stringField = String(field ?? '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const csvContent = [
        headers.join(','),
        ...formattedResult.requirementsList.map(item => [
            escapeCsvField(item.group),
            escapeCsvField(item.id),
            escapeCsvField(item.sequence),
            escapeCsvField(item.description)
        ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'requirements.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
        switch (activeTab) {
            case 'view':
                return <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none w-full h-full overflow-auto p-4" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
            case 'md':
                return <pre className="w-full h-full overflow-auto whitespace-pre-wrap p-4 text-sm"><code>{markdownContent}</code></pre>;
            case 'html':
                return <pre className="w-full h-full overflow-auto whitespace-pre-wrap p-4 text-sm"><code>{htmlContent}</code></pre>;
            case 'csv':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <p className="mb-4">요구사항 목록을 CSV 파일로 다운로드할 수 있습니다.</p>
                        <button
                            onClick={handleDownloadCsv}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
                            >
                            <DownloadIcon className="-ml-1 mr-2 h-5 w-5" />
                            <span>CSV 다운로드</span>
                        </button>
                    </div>
                );
        }
      case AppStatus.IDLE:
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>정리된 요구사항이 여기에 표시됩니다.</p>
          </div>
        );
    }
  };

  const TabButton: React.FC<{tab: Tab, label: string}> = ({ tab, label }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 font-medium text-sm rounded-md ${activeTab === tab ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        aria-current={activeTab === tab ? 'page' : undefined}
    >
        {label}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">정리된 결과</h2>
        {status === AppStatus.SUCCESS && formattedResult && activeTab !== 'csv' && (
          <div className="flex items-center space-x-2">
            <button onClick={handleDownloadMd} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all">
              <DownloadIcon className="mr-2 h-4 w-4" />
              <span>.md 다운로드</span>
            </button>
            <button onClick={() => handleCopy(activeTab === 'html' ? htmlContent : markdownContent)} className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all w-28 justify-center">
              {isCopied ? (
                <>
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  <span>복사 완료!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="mr-2 h-4 w-4" />
                  <span>원본 복사</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {status === AppStatus.SUCCESS && (
        <div className="border-b border-gray-200 mb-2">
            <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                <TabButton tab="view" label="결과 뷰" />
                <TabButton tab="md" label="Markdown" />
                <TabButton tab="html" label="HTML" />
                <TabButton tab="csv" label="CSV" />
            </nav>
        </div>
      )}

      <div className="flex-grow bg-neutral-light rounded-md min-h-[300px] lg:min-h-0 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};