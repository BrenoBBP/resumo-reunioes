'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

// Toast store (simple implementation)
let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

function notifyListeners() {
    listeners.forEach((listener) => listener([...toasts]));
}

export function toast(message: string, type: ToastType = 'info') {
    const id = Math.random().toString(36).substring(7);
    toasts = [...toasts, { id, message, type }];
    notifyListeners();

    // Auto remove after 4 seconds
    setTimeout(() => {
        toasts = toasts.filter((t) => t.id !== id);
        notifyListeners();
    }, 4000);
}

export function ToastContainer() {
    const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

    useEffect(() => {
        listeners.push(setCurrentToasts);
        return () => {
            listeners = listeners.filter((l) => l !== setCurrentToasts);
        };
    }, []);

    const removeToast = (id: string) => {
        toasts = toasts.filter((t) => t.id !== id);
        notifyListeners();
    };

    const icons = {
        success: <CheckCircle size={20} className="text-[var(--success)]" />,
        error: <XCircle size={20} className="text-[var(--danger)]" />,
        warning: <AlertTriangle size={20} className="text-[var(--warning)]" />,
        info: <Info size={20} className="text-[var(--primary)]" />,
    };

    const borderColors = {
        success: 'border-l-[var(--success)]',
        error: 'border-l-[var(--danger)]',
        warning: 'border-l-[var(--warning)]',
        info: 'border-l-[var(--primary)]',
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {currentToasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={`
              pointer-events-auto
              flex items-center gap-3'
              px-4 py-3
              bg-[var(--surface-elevated)] backdrop-blur-[20px]
              border border-[var(--glass-border)] border-l-4
              ${borderColors[t.type]}
              rounded-[var(--radius-md)]
              shadow-[var(--shadow-lg)]
              min-w-[280px] max-w-[400px]
            `}
                    >
                        {icons[t.type]}
                        <p className="flex-1 text-sm text-[var(--text)]">{t.message}</p>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="p-1 rounded hover:bg-[var(--glass-bg)] transition-colors"
                        >
                            <X size={16} className="text-[var(--text-muted)]" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
