'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptSegment } from '@/types';

interface TranscriptAreaProps {
    segments: TranscriptSegment[];
    interimText?: string;
    currentSpeakerName?: string;
}

export function TranscriptArea({ segments, interimText, currentSpeakerName }: TranscriptAreaProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new segments appear or interim text changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [segments.length, interimText]);

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
                {segments.length === 0 && !interimText ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center"
                    >
                        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-[var(--recording)] animate-pulse" />
                        </div>
                        <p className="text-[var(--text-secondary)]">
                            Aguardando transcrição...
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            A transcrição aparecerá aqui em tempo real
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {segments.map((segment, index) => (
                            <motion.div
                                key={segment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`
                                    p-4 rounded-[var(--radius-md)]
                                    bg-[var(--glass-bg)] border border-[var(--glass-border)]
                                `}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {segment.speakerName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="font-medium text-[var(--text)]">
                                        {segment.speakerName}
                                    </span>
                                    <span className="text-xs text-[var(--text-muted)] ml-auto">
                                        {formatTimestamp(segment.timestamp)}
                                    </span>
                                </div>
                                <p className="text-[var(--text-secondary)] pl-10">
                                    {segment.text}
                                </p>
                            </motion.div>
                        ))}
                    </>
                )}
            </AnimatePresence>

            {/* Interim text - shown while user is speaking */}
            {interimText && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`
                        p-4 rounded-[var(--radius-md)]
                        bg-[var(--primary-subtle)] border border-[var(--primary)]/30
                        border-dashed
                    `}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                                {(currentSpeakerName || 'P').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="font-medium text-[var(--text)]">
                            {currentSpeakerName || 'Participante'}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                            />
                            <span className="text-xs text-[var(--primary)] ml-2">digitando</span>
                        </div>
                    </div>
                    <p className="text-[var(--text)] pl-10 italic">
                        {interimText}
                    </p>
                </motion.div>
            )}

            <div ref={bottomRef} />
        </div>
    );
}
