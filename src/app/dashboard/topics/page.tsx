'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FolderOpen, ChevronRight, Calendar, Clock, Plus } from 'lucide-react';
import { Topbar } from '@/components/layout';
import { Card, CardContent, Input, Button, Chip } from '@/components/ui';
import { DurationDisplay } from '@/components/meeting';
import { useMeetingStore } from '@/stores/meeting-store';
import { mockTags, mockMeetings } from '@/lib/storage/mock-data';

export default function TopicsPage() {
    const { tags, meetings, addTag } = useMeetingStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTag, setExpandedTag] = useState<string | null>(null);
    const [showNewTag, setShowNewTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    // Use mock data if store is empty
    const displayTags = tags.length > 0 ? tags : mockTags;
    const displayMeetings = meetings.length > 0 ? meetings : mockMeetings;

    // Filter and get meeting counts
    const filteredTags = displayTags
        .filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((tag) => ({
            ...tag,
            meetingCount: displayMeetings.filter((m) =>
                m.tags.some((t) => t.id === tag.id)
            ).length,
            meetings: displayMeetings.filter((m) =>
                m.tags.some((t) => t.id === tag.id)
            ),
        }))
        .sort((a, b) => b.meetingCount - a.meetingCount);

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    const handleCreateTag = () => {
        if (!newTagName.trim()) return;
        const colors = ['indigo', 'purple', 'blue', 'green', 'orange', 'pink'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        addTag(newTagName.trim(), randomColor);
        setNewTagName('');
        setShowNewTag(false);
    };

    return (
        <div className="min-h-screen">
            <Topbar title="Assuntos" />

            <div className="p-6">
                {/* Header Actions */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 max-w-md">
                        <Input
                            type="search"
                            placeholder="Buscar assuntos..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                    </div>
                    <Button variant="secondary" onClick={() => setShowNewTag(true)}>
                        <Plus size={18} />
                        Novo Assunto
                    </Button>
                </div>

                {/* New Tag Input */}
                {showNewTag && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 mb-6"
                    >
                        <Input
                            placeholder="Nome do assunto..."
                            value={newTagName}
                            onChange={setNewTagName}
                            className="max-w-xs"
                        />
                        <Button variant="primary" onClick={handleCreateTag}>
                            Criar
                        </Button>
                        <Button variant="ghost" onClick={() => setShowNewTag(false)}>
                            Cancelar
                        </Button>
                    </motion.div>
                )}

                {/* Tags List */}
                <div className="space-y-3">
                    {filteredTags.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-full bg-[var(--glass-bg)] flex items-center justify-center mb-4">
                                <FolderOpen size={32} className="text-[var(--text-muted)]" />
                            </div>
                            <p className="text-[var(--text-secondary)]">Nenhum assunto encontrado</p>
                        </div>
                    ) : (
                        filteredTags.map((tag, index) => (
                            <motion.div
                                key={tag.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Card
                                    hover={false}
                                    className="overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedTag(
                                            expandedTag === tag.id ? null : tag.id
                                        )}
                                        className="w-full text-left"
                                    >
                                        <CardContent className="flex items-center gap-4 p-4">
                                            {/* Tag Chip */}
                                            <Chip label={tag.name} color={tag.color} />

                                            {/* Info */}
                                            <div className="flex-1">
                                                <p className="text-sm text-[var(--text-muted)]">
                                                    {tag.meetingCount} reunião{tag.meetingCount !== 1 ? 'ões' : ''}
                                                </p>
                                            </div>

                                            {/* Chevron */}
                                            <motion.div
                                                animate={{ rotate: expandedTag === tag.id ? 90 : 0 }}
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
                                            height: expandedTag === tag.id ? 'auto' : 0,
                                            opacity: expandedTag === tag.id ? 1 : 0,
                                        }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-2 border-t border-[var(--glass-border)]">
                                            {tag.meetings.length === 0 ? (
                                                <p className="text-sm text-[var(--text-muted)] py-2">
                                                    Nenhuma reunião com este assunto
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {tag.meetings.slice(0, 5).map((meeting) => (
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
                                                    {tag.meetings.length > 5 && (
                                                        <p className="text-xs text-[var(--text-muted)] text-center pt-2">
                                                            + mais {tag.meetings.length - 5} reuniões
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
