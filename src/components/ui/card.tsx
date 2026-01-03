'use client';

import { motion } from 'framer-motion';
import { CardProps } from '@/types';

export function Card({
    children,
    className = '',
    hover = true,
    onClick
}: CardProps) {
    const Component = onClick ? motion.button : motion.div;

    return (
        <Component
            onClick={onClick}
            className={`
        bg-[var(--glass-bg)] backdrop-blur-[20px]
        border border-[var(--glass-border)]
        rounded-[var(--radius-lg)]
        shadow-[var(--shadow-sm)]
        transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
        ${hover ? 'hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-hover)] hover:shadow-[var(--shadow-md)]' : ''}
        ${onClick ? 'cursor-pointer text-left w-full' : ''}
        ${className}
      `}
            whileHover={hover ? { y: -2 } : undefined}
            whileTap={onClick ? { scale: 0.99 } : undefined}
        >
            {children}
        </Component>
    );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-5 py-4 border-b border-[var(--glass-border)] ${className}`}>
            {children}
        </div>
    );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-5 py-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`px-5 py-4 border-t border-[var(--glass-border)] ${className}`}>
            {children}
        </div>
    );
}
