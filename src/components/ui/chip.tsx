'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ChipProps } from '@/types';

const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    default: 'bg-[var(--glass-bg)] text-[var(--text-secondary)] border-[var(--glass-border)]',
};

export function Chip({
    label,
    color = 'default',
    removable = false,
    onRemove,
    onClick,
    size = 'md',
    className = '',
}: ChipProps) {
    const colorClasses = colorMap[color] || colorMap.default;
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

    return (
        <motion.span
            onClick={onClick}
            className={`
        inline-flex items-center gap-1.5
        ${sizeClasses}
        border rounded-[var(--radius-full)]
        font-medium
        transition-all duration-[var(--duration-fast)]
        ${colorClasses}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
            whileHover={onClick ? { scale: 1.05 } : undefined}
            whileTap={onClick ? { scale: 0.95 } : undefined}
        >
            {label}
            {removable && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X size={12} />
                </button>
            )}
        </motion.span>
    );
}

export function ChipGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {children}
        </div>
    );
}
