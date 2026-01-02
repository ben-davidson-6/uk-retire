import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || (
          <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-500 dark:text-gray-400 border border-gray-400 dark:border-gray-500 rounded-full">
            ?
          </span>
        )}
      </div>
      {isVisible && (
        <div className="absolute z-50 w-64 p-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg -top-2 left-6 transform">
          {content}
          <div className="absolute w-2 h-2 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-600 transform rotate-45 top-3 -left-1" />
        </div>
      )}
    </div>
  );
}
