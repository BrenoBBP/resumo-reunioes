'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    FolderOpen,
    Settings,
    Mic,
    ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { id: 'meetings', label: 'Reuniões', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'people', label: 'Pessoas', icon: Users, href: '/dashboard/people' },
    { id: 'topics', label: 'Assuntos', icon: FolderOpen, href: '/dashboard/topics' },
    { id: 'settings', label: 'Configurações', icon: Settings, href: '/dashboard/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 260 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`
        fixed left-0 top-0 h-screen z-40
        bg-[var(--surface-elevated)]/80 backdrop-blur-[20px]
        border-r border-[var(--glass-border)]
        flex flex-col
      `}
        >
            {/* Logo */}
            <div className="p-4 border-b border-[var(--glass-border)]">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                        <Mic size={20} className="text-white" />
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-semibold text-[var(--text)] whitespace-nowrap"
                        >
                            Resumo IA
                        </motion.span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
                transition-all duration-[var(--duration-normal)]
                ${isActive
                                    ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text)]'
                                }
              `}
                        >
                            <Icon size={20} />
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                            {isActive && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute left-0 w-1 h-6 bg-[var(--primary)] rounded-r-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Button */}
            <div className="p-3 border-t border-[var(--glass-border)]">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`
            w-full flex items-center justify-center gap-2 px-3 py-2
            text-[var(--text-muted)] hover:text-[var(--text)]
            rounded-[var(--radius-md)] hover:bg-[var(--glass-bg)]
            transition-all duration-[var(--duration-normal)]
          `}
                >
                    <motion.div
                        animate={{ rotate: collapsed ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <ChevronLeft size={20} />
                    </motion.div>
                    {!collapsed && <span className="text-sm">Recolher</span>}
                </button>
            </div>
        </motion.aside>
    );
}
