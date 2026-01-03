'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Pause,
    Play,
    Square,
    Users,
    UserPlus,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Chip, ChipGroup, Modal, Card, CardContent } from '@/components/ui';
import { Timer, TranscriptArea, TempLinkSection } from '@/components/meeting';
import { useMeetingStore } from '@/stores/meeting-store';
import { Person, TranscriptSegment } from '@/types';
import { startTranscription, stopTranscription } from '@/lib/transcription';
import { mockPeople } from '@/lib/storage/mock-data';

export default function MeetingPage() {
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const {
        currentMeeting,
        currentSpeaker,
        isRecording,
        isPaused,
        people,
        getMeetingById,
        updateMeeting,
        pauseRecording,
        resumeRecording,
        stopRecording,
        setCurrentSpeaker,
        switchSpeaker,
        addPerson,
        addParticipantToMeeting,
        removeParticipantFromMeeting,
        addTranscriptSegment,
    } = useMeetingStore();

    const [title, setTitle] = useState('');
    const [showSpeakerModal, setShowSpeakerModal] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [interimText, setInterimText] = useState('');

    // Load meeting data
    useEffect(() => {
        const meeting = getMeetingById(meetingId);
        if (meeting) {
            setTitle(meeting.title);
            setTranscript(meeting.transcript);
        }
    }, [meetingId, getMeetingById]);

    // Setup transcription callback
    const handleTranscriptSegment = useCallback((segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => {
        const fullSegment: TranscriptSegment = {
            ...segment,
            id: Math.random().toString(36).substring(2, 15),
            speakerId: currentSpeaker?.id || segment.speakerId,
            speakerName: currentSpeaker?.name || segment.speakerName,
            createdAt: new Date(),
        };

        setTranscript((prev) => [...prev, fullSegment]);
        addTranscriptSegment(segment);
    }, [currentSpeaker, addTranscriptSegment]);

    // Handle interim text (real-time display while speaking)
    const handleInterimResult = useCallback((text: string) => {
        setInterimText(text);
    }, []);

    // Start/stop transcription based on recording state
    useEffect(() => {
        if (isRecording && !isPaused) {
            startTranscription(handleTranscriptSegment, {
                language: 'pt-BR',
                speakerName: currentSpeaker?.name || 'Participante',
            }, handleInterimResult);
        } else {
            stopTranscription();
            setInterimText('');
        }

        return () => stopTranscription();
    }, [isRecording, isPaused, handleTranscriptSegment, currentSpeaker, handleInterimResult]);

    // Update meeting title
    const handleTitleChange = (value: string) => {
        setTitle(value);
        updateMeeting(meetingId, { title: value });
    };

    // Handle finish
    const handleFinish = () => {
        stopRecording();
        updateMeeting(meetingId, {
            transcript,
            status: 'completed',
        });
        router.push(`/summary/${meetingId}`);
    };

    // Handle speaker selection
    const handleSelectSpeaker = (person: Person) => {
        switchSpeaker(person);
        setShowSpeakerModal(false);
    };

    // Handle add participant
    const handleAddParticipant = (person: Person) => {
        addParticipantToMeeting(meetingId, person);
        setShowAddParticipant(false);
    };

    const handleCreateAndAddParticipant = () => {
        if (!newParticipantName.trim()) return;
        const person = addPerson(newParticipantName.trim());
        handleAddParticipant(person);
        setNewParticipantName('');
    };

    const meeting = currentMeeting || getMeetingById(meetingId);
    const availablePeople = people.length > 0 ? people : mockPeople;

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

    return (
        <div className="min-h-screen bg-[var(--surface)] flex flex-col">
            {/* Header */}
            <header className="border-b border-[var(--glass-border)] bg-[var(--surface-elevated)]/80 backdrop-blur-[10px]">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-4">
                        {/* Back Button */}
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>

                        {/* Title Input */}
                        <div className="flex-1 max-w-md">
                            <Input
                                value={title}
                                onChange={handleTitleChange}
                                placeholder="Título da reunião..."
                                className="!bg-transparent !border-transparent hover:!border-[var(--glass-border)]"
                            />
                        </div>

                        {/* Recording Status */}
                        <div className="flex items-center gap-3">
                            <Timer
                                isRunning={isRecording}
                                isPaused={isPaused}
                                onDurationChange={(d) => updateMeeting(meetingId, { duration: d })}
                            />

                            <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                ${isPaused
                                    ? 'bg-[var(--warning)]/20 text-[var(--warning)]'
                                    : 'bg-[var(--recording)]/20 text-[var(--recording)]'
                                }
              `}>
                                <motion.div
                                    className={`w-2 h-2 rounded-full ${isPaused ? 'bg-[var(--warning)]' : 'bg-[var(--recording)]'}`}
                                    animate={!isPaused ? { opacity: [1, 0.4, 1] } : {}}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <span className="text-sm font-medium">
                                    {isPaused ? 'Pausado' : 'Gravando'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-sm text-[var(--text-muted)]">Participantes:</span>
                        <ChipGroup>
                            {meeting.participants.map((p) => (
                                <Chip
                                    key={p.id}
                                    label={p.name}
                                    color="indigo"
                                    size="sm"
                                    removable
                                    onRemove={() => removeParticipantFromMeeting(meetingId, p.id)}
                                />
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddParticipant(true)}
                                className="!py-0.5"
                            >
                                <UserPlus size={14} />
                                Adicionar
                            </Button>
                        </ChipGroup>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex max-w-7xl mx-auto w-full">
                {/* Transcript Area */}
                <div className="flex-1 flex flex-col border-r border-[var(--glass-border)]">
                    <TranscriptArea
                        segments={transcript}
                        interimText={interimText}
                        currentSpeakerName={currentSpeaker?.name}
                    />
                </div>

                {/* Sidebar */}
                <aside className="w-80 p-4 space-y-4 hidden lg:block">
                    {/* Current Speaker */}
                    <Card hover={false}>
                        <CardContent>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-[var(--text-muted)]">Falando agora</span>
                                <Button variant="ghost" size="sm" onClick={() => setShowSpeakerModal(true)}>
                                    <RefreshCw size={14} />
                                    Trocar
                                </Button>
                            </div>
                            {currentSpeaker ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                            {currentSpeaker.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="font-medium text-[var(--text)]">{currentSpeaker.name}</span>
                                </div>
                            ) : (
                                <p className="text-[var(--text-secondary)]">Nenhum falante selecionado</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Participants List */}
                    <Card hover={false}>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={16} className="text-[var(--text-muted)]" />
                                <span className="text-sm text-[var(--text-muted)]">
                                    Participantes ({meeting.participants.length})
                                </span>
                            </div>
                            <div className="space-y-2">
                                {meeting.participants.map((p) => (
                                    <div
                                        key={p.id}
                                        className={`
                      flex items-center gap-2 p-2 rounded-[var(--radius-sm)]
                      ${currentSpeaker?.id === p.id ? 'bg-[var(--primary-subtle)]' : ''}
                    `}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                            <span className="text-white text-sm">
                                                {p.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-[var(--text)]">{p.name}</span>
                                        {currentSpeaker?.id === p.id && (
                                            <span className="text-xs text-[var(--primary)] ml-auto">Falando</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Temp Link Section */}
                    <TempLinkSection meetingId={meetingId} />
                </aside>
            </div>

            {/* Footer Controls */}
            <footer className="border-t border-[var(--glass-border)] bg-[var(--surface-elevated)]/80 backdrop-blur-[10px] p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={isPaused ? resumeRecording : pauseRecording}
                    >
                        {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        {isPaused ? 'Continuar' : 'Pausar'}
                    </Button>

                    <Button
                        variant="danger"
                        size="lg"
                        onClick={handleFinish}
                    >
                        <Square size={20} />
                        Finalizar
                    </Button>
                </div>
            </footer>

            {/* Speaker Selection Modal */}
            <Modal
                isOpen={showSpeakerModal}
                onClose={() => setShowSpeakerModal(false)}
                title="Trocar Falante"
            >
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {meeting.participants.map((person) => (
                        <button
                            key={person.id}
                            onClick={() => handleSelectSpeaker(person)}
                            className={`
                w-full flex items-center gap-3 p-3 rounded-[var(--radius-md)]
                border transition-all
                ${currentSpeaker?.id === person.id
                                    ? 'bg-[var(--primary-subtle)] border-[var(--primary)]'
                                    : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
                                }
              `}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                <span className="text-white font-medium">
                                    {person.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="font-medium text-[var(--text)]">{person.name}</span>
                        </button>
                    ))}
                </div>
            </Modal>

            {/* Add Participant Modal */}
            <Modal
                isOpen={showAddParticipant}
                onClose={() => setShowAddParticipant(false)}
                title="Adicionar Participante"
            >
                <div className="space-y-4">
                    <p className="text-[var(--text-secondary)]">
                        Selecione uma pessoa ou crie nova.
                    </p>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availablePeople
                            .filter((p) => !meeting.participants.some((mp) => mp.id === p.id))
                            .map((person) => (
                                <button
                                    key={person.id}
                                    onClick={() => handleAddParticipant(person)}
                                    className="w-full flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                        <span className="text-white text-sm">{person.name.charAt(0)}</span>
                                    </div>
                                    <span className="text-[var(--text)]">{person.name}</span>
                                </button>
                            ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-[var(--glass-border)]" />
                        <span className="text-sm text-[var(--text-muted)]">ou criar</span>
                        <div className="flex-1 h-px bg-[var(--glass-border)]" />
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Nome da pessoa"
                            value={newParticipantName}
                            onChange={setNewParticipantName}
                            className="flex-1"
                        />
                        <Button variant="primary" onClick={handleCreateAndAddParticipant}>
                            Criar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
