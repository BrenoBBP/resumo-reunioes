'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
    isRunning: boolean;
    isPaused: boolean;
    onDurationChange?: (seconds: number) => void;
}

export function Timer({ isRunning, isPaused, onDurationChange }: TimerProps) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && !isPaused) {
            interval = setInterval(() => {
                setSeconds((s) => {
                    const newValue = s + 1;
                    onDurationChange?.(newValue);
                    return newValue;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, isPaused, onDurationChange]);

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-lg text-[var(--text)]">
                {formatTime(seconds)}
            </span>
        </div>
    );
}

// Static display version for read-only contexts
export function DurationDisplay({ seconds }: { seconds: number }) {
    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m ${secs}s`;
    };

    return (
        <span className="text-[var(--text-secondary)]">
            {formatTime(seconds)}
        </span>
    );
}
