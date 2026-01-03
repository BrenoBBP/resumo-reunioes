'use client';

import { motion } from 'framer-motion';
import { ButtonProps } from '@/types';

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    onClick,
    disabled = false,
    className = '',
    type = 'button',
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center font-medium
    transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  `;

    const variants = {
        primary: `
      bg-[var(--primary)] text-white
      hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-glow)]
      active:scale-[0.98]
    `,
        secondary: `
      bg-[var(--glass-bg)] text-[var(--text)] border border-[var(--glass-border)]
      backdrop-blur-[var(--glass-blur)]
      hover:bg-[var(--glass-bg-hover)] hover:border-[var(--glass-border-hover)]
      active:scale-[0.98]
    `,
        ghost: `
      bg-transparent text-[var(--text-secondary)]
      hover:bg-[var(--glass-bg)] hover:text-[var(--text)]
      active:scale-[0.98]
    `,
        danger: `
      bg-[var(--danger)] text-white
      hover:opacity-90 hover:shadow-[0_0_20px_var(--danger-glow)]
      active:scale-[0.98]
    `,
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)] gap-1.5',
        md: 'px-4 py-2 text-sm rounded-[var(--radius-md)] gap-2',
        lg: 'px-6 py-3 text-base rounded-[var(--radius-md)] gap-2',
        icon: 'p-2.5 rounded-[var(--radius-md)]',
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
        >
            {children}
        </motion.button>
    );
}
