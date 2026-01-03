'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Users, Trash2, Edit2 } from 'lucide-react';
import { Button, Card, CardContent, Chip, ChipGroup, ConfirmDialog, toast } from '@/components/ui';
import { DurationDisplay } from '@/components/meeting';
import { useMeetingStore } from '@/stores/meeting-store';
import { mockMeetings } from '@/lib/storage/mock-data';

export default function MeetingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params.id as string;

    const { getMeetingById, deleteMeeting, meetings } = useMeetingStore();
    const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('summary');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const displayMeetings = meetings.length > 0 ? meetings : mockMeetings;
    const meeting = getMeetingById(meetingId) || displayMeetings.find(m => m.id === meetingId);

    if (!meeting) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-[var(--text-secondary)] mb-4">Reunião não encontrada</p>
                <Link href="/dashboard"><Button variant="primary">Voltar</Button></Link>
            </div>
        );
    }

    const handleDelete = () => {
        deleteMeeting(meetingId);
        toast('Reunião excluída', 'success');
        router.push('/dashboard');
    };

    const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="min-h-screen">
            <header className="border-b border-[var(--glass-border)] bg-[var(--surface-elevated)]/80 backdrop-blur-[10px] p-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button></Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-[var(--text)]">{meeting.title}</h1>
                        <div className="flex gap-4 text-sm text-[var(--text-muted)] mt-1">
                            <span className="flex items-center gap-1"><Calendar size={14} />{formatDate(meeting.createdAt)}</span>
                            <span className="flex items-center gap-1"><Clock size={14} /><DurationDisplay seconds={meeting.duration} /></span>
                            <span className="flex items-center gap-1"><Users size={14} />{meeting.participants.length}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={18} /></Button>
                </div>
            </header>

            <div className="p-6">
                <div className="flex gap-4 mb-6">
                    <ChipGroup>
                        {meeting.participants.map(p => <Chip key={p.id} label={p.name} color="purple" size="sm" />)}
                    </ChipGroup>
                    <ChipGroup>
                        {meeting.tags.map(t => <Chip key={t.id} label={t.name} color={t.color} size="sm" />)}
                    </ChipGroup>
                </div>

                <div className="flex gap-2 mb-4">
                    {['summary', 'transcript'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors
                ${activeTab === tab ? 'bg-[var(--primary)] text-white' : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]'}`}>
                            {tab === 'summary' ? 'Resumo' : 'Transcrição'}
                        </button>
                    ))}
                </div>

                {activeTab === 'summary' && meeting.summary && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <Card hover={false}><CardContent>
                            <h3 className="font-semibold text-[var(--text)] mb-2">Tópicos</h3>
                            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
                                {meeting.summary.topics.map((t, i) => <li key={i}>{t}</li>)}
                            </ul>
                        </CardContent></Card>
                        <Card hover={false}><CardContent>
                            <h3 className="font-semibold text-[var(--text)] mb-2">Decisões</h3>
                            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
                                {meeting.summary.decisions.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                        </CardContent></Card>
                        <Card hover={false}><CardContent>
                            <h3 className="font-semibold text-[var(--text)] mb-2">Próximos Passos</h3>
                            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
                                {meeting.summary.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </CardContent></Card>
                    </motion.div>
                )}

                {activeTab === 'transcript' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card hover={false}><CardContent>
                            {meeting.transcript.length === 0 ? (
                                <p className="text-[var(--text-muted)]">Sem transcrição</p>
                            ) : (
                                <div className="space-y-3">
                                    {meeting.transcript.map(seg => (
                                        <div key={seg.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shrink-0">
                                                <span className="text-white text-xs">{seg.speakerName.charAt(0)}</span>
                                            </div>
                                            <div><p className="text-sm font-medium text-[var(--text)]">{seg.speakerName}</p>
                                                <p className="text-[var(--text-secondary)]">{seg.text}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent></Card>
                    </motion.div>
                )}
            </div>

            <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete} title="Excluir reunião?" description="Esta ação não pode ser desfeita."
                confirmLabel="Excluir" variant="danger" />
        </div>
    );
}
