'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';

interface TopbarProps {
    title?: string;
    showNewMeeting?: boolean;
}

export function Topbar({ title = 'Dashboard', showNewMeeting = true }: TopbarProps) {
    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--glass-border)] bg-[var(--surface)]/50 backdrop-blur-[10px]">
            <h1 className="text-xl font-semibold text-[var(--text)]">{title}</h1>

            {showNewMeeting && (
                <Link href="/">
                    <Button variant="primary" size="md">
                        <Plus size={18} />
                        Nova Reunião
                    </Button>
                </Link>
            )}
        </header>
    );
}
