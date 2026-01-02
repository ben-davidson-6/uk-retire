import React from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  className = '',
  disabled = false,
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      const clampedValue = Math.min(
        max ?? Infinity,
        Math.max(min ?? -Infinity, newValue)
      );
      onChange(clampedValue);
    }
  };

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-gray-500 dark:text-gray-400 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`
          w-full px-3 py-2
          ${prefix ? 'pl-7' : ''}
          ${suffix ? 'pr-8' : ''}
          border border-gray-300 dark:border-gray-600
          rounded-md shadow-sm
          bg-white dark:bg-gray-700
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:cursor-not-allowed
          ${className}
        `}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-500 dark:text-gray-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
