'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft,
    Save,
    ListChecks,
    CheckCircle2,
    AlertTriangle,
    Users,
    Lightbulb,
    ArrowRight
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, Chip, ChipGroup, toast } from '@/components/ui';
import { useMeetingStore } from '@/stores/meeting-store';
import { generateSummary } from '@/lib/summarization';
import { MeetingSummary } from '@/types';

export default function SummaryPage() {
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const { getMeetingById, updateMeeting, setSummary } = useMeetingStore();
    const [summary, setSummaryState] = useState<MeetingSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const meeting = getMeetingById(meetingId);

    // Generate summary on load
    useEffect(() => {
        async function loadSummary() {
            if (!meeting) return;

            if (meeting.summary) {
                setSummaryState(meeting.summary);
                setIsLoading(false);
                return;
            }

            try {
                const generatedSummary = await generateSummary(meeting.transcript);
                setSummaryState(generatedSummary);
                setSummary(meetingId, generatedSummary);
            } catch (error) {
                console.error('Error generating summary:', error);
                toast('Erro ao gerar resumo', 'error');
            } finally {
                setIsLoading(false);
            }
        }

        loadSummary();
    }, [meeting, meetingId, setSummary]);

    const handleSave = async () => {
        setIsSaving(true);

        // Simulate save delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (summary) {
            updateMeeting(meetingId, {
                summary,
                status: 'completed',
            });
        }

        toast('Reunião salva com sucesso!', 'success');
        setIsSaving(false);
        router.push('/dashboard');
    };

    if (!meeting) {
        return (
            <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--text-secondary)] mb-4">Reunião não encontrada</p>
                    <Link href="/">
                        <Button variant="primary">Voltar ao Início</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes} minutos`;
    };

    return (
        <div className="min-h-screen bg-[var(--surface)]">
            {/* Header */}
            <header className="border-b border-[var(--glass-border)] bg-[var(--surface-elevated)]/80 backdrop-blur-[10px] sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/meeting/${meetingId}`}>
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft size={20} />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold text-[var(--text)]">
                                    Resumo da Reunião
                                </h1>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {meeting.title} • {formatDuration(meeting.duration)}
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isLoading || isSaving}
                        >
                            <Save size={18} />
                            {isSaving ? 'Salvando...' : 'Salvar no Dashboard'}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <motion.div
                            className="w-16 h-16 mb-6 rounded-full border-4 border-[var(--glass-border)] border-t-[var(--primary)]"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        <p className="text-[var(--text-secondary)]">Gerando resumo com IA...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="grid gap-6 md:grid-cols-2"
                    >
                        {/* Main Topics */}
                        <Card hover={false} className="md:col-span-2">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lightbulb size={20} className="text-[var(--primary)]" />
                                    <h2 className="font-semibold text-[var(--text)]">Principais Tópicos</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {summary?.topics.map((topic, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-medium text-[var(--primary)]">{i + 1}</span>
                                            </div>
                                            <span className="text-[var(--text-secondary)]">{topic}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Decisions */}
                        <Card hover={false}>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-[var(--success)]" />
                                    <h2 className="font-semibold text-[var(--text)]">Decisões</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {summary?.decisions.map((decision, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-2"
                                        >
                                            <CheckCircle2 size={16} className="text-[var(--success)] shrink-0 mt-1" />
                                            <span className="text-[var(--text-secondary)]">{decision}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Next Steps */}
                        <Card hover={false}>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ListChecks size={20} className="text-[var(--primary)]" />
                                    <h2 className="font-semibold text-[var(--text)]">Próximos Passos</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {summary?.nextSteps.map((step, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex items-start gap-2"
                                        >
                                            <ArrowRight size={16} className="text-[var(--primary)] shrink-0 mt-1" />
                                            <span className="text-[var(--text-secondary)]">{step}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Risks */}
                        {summary?.risks && summary.risks.length > 0 && (
                            <Card hover={false} className="border-l-4 border-l-[var(--warning)]">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-[var(--warning)]" />
                                        <h2 className="font-semibold text-[var(--text)]">Riscos e Pendências</h2>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {summary.risks.map((risk, i) => (
                                            <motion.li
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-start gap-2"
                                            >
                                                <AlertTriangle size={16} className="text-[var(--warning)] shrink-0 mt-1" />
                                                <span className="text-[var(--text-secondary)]">{risk}</span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Speaker Statistics */}
                        <Card hover={false} className="md:col-span-2">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users size={20} className="text-[var(--secondary)]" />
                                    <h2 className="font-semibold text-[var(--text)]">Participação por Falante</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    // Calculate speaker statistics from transcript
                                    const speakerStats = meeting.transcript.reduce((acc, segment) => {
                                        const speaker = segment.speakerName || 'Desconhecido';
                                        if (!acc[speaker]) {
                                            acc[speaker] = { count: 0, words: 0 };
                                        }
                                        acc[speaker].count++;
                                        acc[speaker].words += segment.text.split(/\s+/).length;
                                        return acc;
                                    }, {} as Record<string, { count: number; words: number }>);

                                    const totalWords = Object.values(speakerStats).reduce((sum, s) => sum + s.words, 0);
                                    const sortedSpeakers = Object.entries(speakerStats)
                                        .filter(([name]) => name !== 'Sistema')
                                        .sort(([, a], [, b]) => b.words - a.words);

                                    if (sortedSpeakers.length === 0) {
                                        return (
                                            <p className="text-[var(--text-secondary)]">
                                                Nenhuma fala registrada
                                            </p>
                                        );
                                    }

                                    return (
                                        <div className="space-y-4">
                                            {sortedSpeakers.map(([speaker, stats], i) => {
                                                const percentage = totalWords > 0
                                                    ? Math.round((stats.words / totalWords) * 100)
                                                    : 0;
                                                return (
                                                    <motion.div
                                                        key={speaker}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="space-y-2"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                                                    <span className="text-white text-sm font-medium">
                                                                        {speaker.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className="font-medium text-[var(--text)]">
                                                                    {speaker}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm text-[var(--text-secondary)]">
                                                                {stats.count} falas • {stats.words} palavras
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-[var(--text-muted)] text-right">
                                                            {percentage}% da reunião
                                                        </p>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>

                        {/* Participants */}
                        <Card hover={false}>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users size={20} className="text-[var(--secondary)]" />
                                    <h2 className="font-semibold text-[var(--text)]">Participantes</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ChipGroup>
                                    {meeting.participants.map((person) => (
                                        <Chip
                                            key={person.id}
                                            label={person.name}
                                            color="purple"
                                        />
                                    ))}
                                </ChipGroup>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
