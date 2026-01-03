'use client';

import { InputProps } from '@/types';
import { Search } from 'lucide-react';

export function Input({
    label,
    placeholder,
    value,
    onChange,
    type = 'text',
    className = '',
    icon,
    error,
}: InputProps) {
    const hasIcon = icon || type === 'search';

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {label}
                </label>
            )}
            <div className="relative">
                {hasIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        {icon || <Search size={18} />}
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`
            w-full px-4 py-2.5
            ${hasIcon ? 'pl-10' : ''}
            bg-[var(--glass-bg)] backdrop-blur-[20px]
            border border-[var(--glass-border)]
            rounded-[var(--radius-md)]
            text-[var(--text)] placeholder:text-[var(--text-muted)]
            transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
            hover:border-[var(--glass-border-hover)]
            focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]
            ${error ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]' : ''}
          `}
                />
            </div>
            {error && (
                <span className="text-sm text-[var(--danger)]">{error}</span>
            )}
        </div>
    );
}

export function TextArea({
    label,
    placeholder,
    value,
    onChange,
    className = '',
    rows = 4,
}: Omit<InputProps, 'type' | 'icon'> & { rows?: number }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {label}
                </label>
            )}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={`
          w-full px-4 py-2.5
          bg-[var(--glass-bg)] backdrop-blur-[20px]
          border border-[var(--glass-border)]
          rounded-[var(--radius-md)]
          text-[var(--text)] placeholder:text-[var(--text-muted)]
          transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
          hover:border-[var(--glass-border-hover)]
          focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]
          resize-none
        `}
            />
        </div>
    );
}
