'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Search,
    Calendar,
    Clock,
    Users,
    FolderOpen,
    ChevronDown,
    Plus
} from 'lucide-react';
import { Topbar } from '@/components/layout';
import { Card, CardContent, Input, Button, Chip, ChipGroup } from '@/components/ui';
import { DurationDisplay } from '@/components/meeting';
import { useMeetingStore } from '@/stores/meeting-store';
import { Meeting } from '@/types';
import { mockMeetings, mockPeople, mockTags } from '@/lib/storage/mock-data';

export default function DashboardPage() {
    const { meetings, people, tags } = useMeetingStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPerson, setFilterPerson] = useState<string | null>(null);
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

    // Use mock data if store is empty
    const displayMeetings = meetings.length > 0 ? meetings : mockMeetings;
    const displayPeople = people.length > 0 ? people : mockPeople;
    const displayTags = tags.length > 0 ? tags : mockTags;

    // Filter and sort meetings
    const filteredMeetings = displayMeetings
        .filter((m) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = m.title.toLowerCase().includes(query);
                const matchesParticipant = m.participants.some((p) =>
                    p.name.toLowerCase().includes(query)
                );
                const matchesTag = m.tags.some((t) => t.name.toLowerCase().includes(query));
                if (!matchesTitle && !matchesParticipant && !matchesTag) return false;
            }
            if (filterPerson && !m.participants.some((p) => p.id === filterPerson)) return false;
            if (filterTag && !m.tags.some((t) => t.id === filterTag)) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.title.localeCompare(b.title);
        });

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen">
            <Topbar title="Reuniões" />

            <div className="p-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-[200px] max-w-md">
                        <Input
                            type="search"
                            placeholder="Buscar reuniões..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                    </div>

                    {/* Person Filter */}
                    <div className="relative">
                        <select
                            value={filterPerson || ''}
                            onChange={(e) => setFilterPerson(e.target.value || null)}
                            className="appearance-none px-4 py-2.5 pr-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-md)] text-[var(--text)] cursor-pointer hover:border-[var(--glass-border-hover)] focus:outline-none focus:border-[var(--primary)]"
                        >
                            <option value="">Todas as pessoas</option>
                            {displayPeople.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>

                    {/* Tag Filter */}
                    <div className="relative">
                        <select
                            value={filterTag || ''}
                            onChange={(e) => setFilterTag(e.target.value || null)}
                            className="appearance-none px-4 py-2.5 pr-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-md)] text-[var(--text)] cursor-pointer hover:border-[var(--glass-border-hover)] focus:outline-none focus:border-[var(--primary)]"
                        >
                            <option value="">Todos os assuntos</option>
                            {displayTags.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                            className="appearance-none px-4 py-2.5 pr-10 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[var(--radius-md)] text-[var(--text)] cursor-pointer hover:border-[var(--glass-border-hover)] focus:outline-none focus:border-[var(--primary)]"
                        >
                            <option value="date">Ordenar por data</option>
                            <option value="title">Ordenar por título</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                </div>

                {/* Results count */}
                <p className="text-sm text-[var(--text-muted)] mb-4">
                    {filteredMeetings.length} reunião{filteredMeetings.length !== 1 ? 'ões' : ''} encontrada{filteredMeetings.length !== 1 ? 's' : ''}
                </p>

                {/* Meetings Grid */}
                {filteredMeetings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] flex items-center justify-center mb-4">
                            <FolderOpen size={32} className="text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[var(--text-secondary)] mb-2">Nenhuma reunião encontrada</p>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            Tente ajustar os filtros ou inicie uma nova reunião
                        </p>
                        <Link href="/">
                            <Button variant="primary">
                                <Plus size={18} />
                                Nova Reunião
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredMeetings.map((meeting, index) => (
                            <MeetingCard key={meeting.id} meeting={meeting} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MeetingCard({ meeting, index }: { meeting: Meeting; index: number }) {
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link href={`/dashboard/meeting/${meeting.id}`}>
                <Card className="h-full">
                    <CardContent className="p-5">
                        <h3 className="font-semibold text-[var(--text)] mb-3 line-clamp-2">
                            {meeting.title}
                        </h3>

                        {/* Metadata */}
                        <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)] mb-4">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(meeting.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                <DurationDisplay seconds={meeting.duration} />
                            </span>
                            <span className="flex items-center gap-1">
                                <Users size={14} />
                                {meeting.participants.length}
                            </span>
                        </div>

                        {/* Participants */}
                        <div className="flex -space-x-2 mb-3">
                            {meeting.participants.slice(0, 4).map((p) => (
                                <div
                                    key={p.id}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center border-2 border-[var(--surface)]"
                                    title={p.name}
                                >
                                    <span className="text-white text-xs font-medium">
                                        {p.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            ))}
                            {meeting.participants.length > 4 && (
                                <div className="w-8 h-8 rounded-full bg-[var(--glass-bg)] flex items-center justify-center border-2 border-[var(--surface)]">
                                    <span className="text-xs text-[var(--text-muted)]">
                                        +{meeting.participants.length - 4}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {meeting.tags.length > 0 && (
                            <ChipGroup>
                                {meeting.tags.slice(0, 2).map((tag) => (
                                    <Chip
                                        key={tag.id}
                                        label={tag.name}
                                        color={tag.color}
                                        size="sm"
                                    />
                                ))}
                                {meeting.tags.length > 2 && (
                                    <Chip
                                        label={`+${meeting.tags.length - 2}`}
                                        size="sm"
                                    />
                                )}
                            </ChipGroup>
                        )}

                        {/* Status */}
                        <div className="mt-3 pt-3 border-t border-[var(--glass-border)]">
                            <span className={`
                text-xs font-medium
                ${meeting.status === 'completed' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}
              `}>
                                {meeting.status === 'completed' ? '✓ Concluída' : '● Em andamento'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </motion.div>
    );
}
