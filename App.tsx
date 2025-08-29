import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { formatRequirements } from './services/geminiService';
import { AppStatus } from './types';
import type { FilePart } from './services/geminiService';
import type { FormattedResult } from './types';

const App: React.FC = () => {
  const [rawText, setRawText] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [formattedResult, setFormattedResult] = useState<FormattedResult | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const fileToPart = async (file: File): Promise<FilePart> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      mimeType: file.type,
      data: await base64EncodedDataPromise,
    };
  };

  const handleFormat = useCallback(async () => {
    if (!rawText.trim() && files.length === 0) {
      setError('포맷할 요구사항 텍스트를 입력하거나 이미지 파일을 추가해주세요.');
      setStatus(AppStatus.ERROR);
      return;
    }

    setStatus(AppStatus.LOADING);
    setError(null);
    setFormattedResult(null);

    try {
      const fileParts = await Promise.all(files.map(fileToPart));
      const result = await formatRequirements(rawText, fileParts);
      setFormattedResult(result);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(`요구사항 포맷 중 오류가 발생했습니다: ${errorMessage}`);
      setStatus(AppStatus.ERROR);
    }
  }, [rawText, files]);

  const handleClear = useCallback(() => {
    setRawText('');
    setFiles([]);
    setFormattedResult(null);
    setError(null);
    setStatus(AppStatus.IDLE);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2 flex flex-col">
          <InputPanel
            rawText={rawText}
            setRawText={setRawText}
            files={files}
            setFiles={setFiles}
            onFormat={handleFormat}
            onClear={handleClear}
            status={status}
          />
        </div>
        <div className="lg:w-1/2 flex flex-col">
          <OutputPanel
            formattedResult={formattedResult}
            status={status}
            error={error}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;