'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, ChevronRight, Calendar, Clock } from 'lucide-react';
import { Topbar } from '@/components/layout';
import { Card, CardContent, Input } from '@/components/ui';
import { DurationDisplay } from '@/components/meeting';
import { useMeetingStore } from '@/stores/meeting-store';
import { mockPeople, mockMeetings } from '@/lib/storage/mock-data';

export default function PeoplePage() {
    const { people, meetings } = useMeetingStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPerson, setExpandedPerson] = useState<string | null>(null);

    // Use mock data if store is empty
    const displayPeople = people.length > 0 ? people : mockPeople;
    const displayMeetings = meetings.length > 0 ? meetings : mockMeetings;

    // Filter and get meeting counts
    const filteredPeople = displayPeople
        .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((person) => ({
            ...person,
            meetingCount: displayMeetings.filter((m) =>
                m.participants.some((p) => p.id === person.id)
            ).length,
            meetings: displayMeetings.filter((m) =>
                m.participants.some((p) => p.id === person.id)
            ),
        }))
        .sort((a, b) => b.meetingCount - a.meetingCount);

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <div className="min-h-screen">
            <Topbar title="Pessoas" />

            <div className="p-6">
                {/* Search */}
                <div className="max-w-md mb-6">
                    <Input
                        type="search"
                        placeholder="Buscar pessoas..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>

                {/* People List */}
                <div className="space-y-3">
                    {filteredPeople.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] flex items-center justify-center mb-4">
                                <Users size={32} className="text-[var(--text-muted)]" />
                            </div>
                            <p className="text-[var(--text-secondary)]">Nenhuma pessoa encontrada</p>
                        </div>
                    ) : (
                        filteredPeople.map((person, index) => (
                            <motion.div
                                key={person.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card
                                    hover={false}
                                    className="overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedPerson(
                                            expandedPerson === person.id ? null : person.id
                                        )}
                                        className="w-full text-left"
                                    >
                                        <CardContent className="flex items-center gap-4 p-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {person.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-[var(--text)]">
                                                    {person.name}
                                                </h3>
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    {person.meetingCount} reunião{person.meetingCount !== 1 ? 'ões' : ''}
                                                </p>
                                            </div>

                                            {/* Chevron */}
                                            <motion.div
                                                animate={{ rotate: expandedPerson === person.id ? 90 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronRight size={20} className="text-[var(--text-muted)]" />
                                            </motion.div>
                                        </CardContent>
                                    </button>

                                    {/* Expanded Meetings */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            height: expandedPerson === person.id ? 'auto' : 0,
                                            opacity: expandedPerson === person.id ? 1 : 0,
                                        }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-2 border-t border-[var(--glass-border)]">
                                            {person.meetings.length === 0 ? (
                                                <p className="text-sm text-[var(--text-muted)] py-2">
                                                    Nenhuma reunião registrada
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {person.meetings.slice(0, 5).map((meeting) => (
                                                        <Link
                                                            key={meeting.id}
                                                            href={`/dashboard/meeting/${meeting.id}`}
                                                            className="flex items-center gap-3 p-2 rounded-[var(--radius-sm)] hover:bg-[var(--glass-bg)] transition-colors"
                                                        >
                                                            <span className="text-sm text-[var(--text)] flex-1 truncate">
                                                                {meeting.title}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                                <Calendar size={12} />
                                                                {formatDate(meeting.createdAt)}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                                                                <Clock size={12} />
                                                                <DurationDisplay seconds={meeting.duration} />
                                                            </span>
                                                        </Link>
                                                    ))}
                                                    {person.meetings.length > 5 && (
                                                        <p className="text-xs text-[var(--text-muted)] text-center pt-2">
                                                            + mais {person.meetings.length - 5} reuniões
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
