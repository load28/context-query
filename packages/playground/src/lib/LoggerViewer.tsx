import { useEffect, useRef } from "react";
import { createLogger, useLogs } from "./logger";

interface LogViewerProps {
  logger: ReturnType<typeof createLogger>;
  maxLogs?: number;
  title?: string;
}

export function LogViewer({ logger, maxLogs = 100, title }: LogViewerProps) {
  const logs = useLogs(logger, maxLogs);
  const logContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    logger.clear();
  };

  return (
    <div
      className={
        "log-viewer rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900"
      }
    >
      <div className="flex justify-between items-center mb-3">
        {title && (
          <div className="log-viewer-title font-semibold text-lg text-gray-800 dark:text-gray-200 flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            {title}
          </div>
        )}
        <button
          onClick={clearLogs}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors duration-200 flex items-center"
          aria-label="로그 초기화"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          초기화
        </button>
      </div>
      <div
        ref={logContentRef}
        className="log-content max-h-96 overflow-y-auto rounded-md bg-gray-50 dark:bg-gray-800 p-3 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="log-empty text-gray-400 dark:text-gray-500 italic text-center py-4">
            로그가 없습니다
          </div>
        ) : (
          logs.map((log: string, index: number) => (
            <div
              key={index}
              className="log-line py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0 text-gray-700 dark:text-gray-300"
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
