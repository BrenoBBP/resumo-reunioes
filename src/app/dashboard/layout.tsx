'use client';

import { Sidebar } from '@/components/layout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--surface)]">
            <Sidebar />
            <main className="lg:pl-[260px] min-h-screen">
                {children}
            </main>
        </div>
    );
}
