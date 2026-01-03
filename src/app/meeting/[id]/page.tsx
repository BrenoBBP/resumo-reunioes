'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Pause,
    Play,
    Square,
    Users,
    UserPlus,
    RefreshCw,
    Mic,
    Edit3
} from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Chip, ChipGroup, Modal, Card, CardContent } from '@/components/ui';
import { Timer, TranscriptArea, TempLinkSection } from '@/components/meeting';
import { useMeetingStore } from '@/stores/meeting-store';
import { Person, TranscriptSegment } from '@/types';
import {
    startTranscription,
    stopTranscription,
    startAssemblyAITranscription,
    stopAssemblyAITranscription,
    setSpeakerName,
    isAssemblyAIAvailable
} from '@/lib/transcription';
import { mockPeople } from '@/lib/storage/mock-data';

// Speaker detected by AssemblyAI
interface DetectedSpeaker {
    id: string;
    defaultName: string;
    customName: string;
    segmentCount: number;
}

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
        switchSpeaker,
        addPerson,
        addParticipantToMeeting,
        removeParticipantFromMeeting,
        addTranscriptSegment,
    } = useMeetingStore();

    const [title, setTitle] = useState('');
    const [showSpeakerModal, setShowSpeakerModal] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [showSpeakerManagerModal, setShowSpeakerManagerModal] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [interimText, setInterimText] = useState('');
    const [usingAssemblyAI, setUsingAssemblyAI] = useState(false);
    const [detectedSpeakers, setDetectedSpeakers] = useState<DetectedSpeaker[]>([]);
    const [activeSpeakerName, setActiveSpeakerName] = useState<string>('');
    const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
    const [editingSpeakerName, setEditingSpeakerName] = useState('');

    // Load meeting data
    useEffect(() => {
        const meeting = getMeetingById(meetingId);
        if (meeting) {
            setTitle(meeting.title);
            setTranscript(meeting.transcript);
        }
    }, [meetingId, getMeetingById]);

    // Track detected speakers from transcript
    const updateDetectedSpeaker = useCallback((speakerId: string, speakerName: string) => {
        setDetectedSpeakers(prev => {
            const existing = prev.find(s => s.id === speakerId);
            if (existing) {
                return prev.map(s =>
                    s.id === speakerId
                        ? { ...s, segmentCount: s.segmentCount + 1 }
                        : s
                );
            }
            return [...prev, {
                id: speakerId,
                defaultName: speakerName,
                customName: speakerName,
                segmentCount: 1
            }];
        });
        setActiveSpeakerName(speakerName);
    }, []);

    // Setup transcription callback for AssemblyAI
    const handleAssemblyAISegment = useCallback((segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => {
        // Skip system messages from speaker tracking
        if (segment.speakerId !== 'system') {
            updateDetectedSpeaker(segment.speakerId, segment.speakerName);
        }

        const fullSegment: TranscriptSegment = {
            ...segment,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: new Date(),
        };

        setTranscript((prev) => [...prev, fullSegment]);
        addTranscriptSegment(segment);
    }, [addTranscriptSegment, updateDetectedSpeaker]);

    // Setup transcription callback for Web Speech API (fallback)
    const handleWebSpeechSegment = useCallback((segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => {
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
            // Try AssemblyAI first, fall back to Web Speech
            const startRecording = async () => {
                const assemblyAIAvailable = await isAssemblyAIAvailable();

                if (assemblyAIAvailable) {
                    console.log('[Meeting] Starting AssemblyAI transcription');
                    const started = await startAssemblyAITranscription(handleAssemblyAISegment, {
                        language: 'pt-BR',
                        onSpeakerChange: (speaker) => setActiveSpeakerName(speaker)
                    });

                    if (started) {
                        setUsingAssemblyAI(true);
                        return;
                    }
                }

                // Fallback to Web Speech
                console.log('[Meeting] Using Web Speech API fallback');
                setUsingAssemblyAI(false);
                startTranscription(handleWebSpeechSegment, {
                    language: 'pt-BR',
                    speakerName: currentSpeaker?.name || 'Participante',
                }, handleInterimResult);
            };

            startRecording();
        } else {
            if (usingAssemblyAI) {
                stopAssemblyAITranscription();
            } else {
                stopTranscription();
            }
            setInterimText('');
        }

        return () => {
            stopAssemblyAITranscription();
            stopTranscription();
        };
    }, [isRecording, isPaused, handleAssemblyAISegment, handleWebSpeechSegment, currentSpeaker, handleInterimResult, usingAssemblyAI]);

    // Handle speaker name update
    const handleUpdateSpeakerName = (speakerId: string, newName: string) => {
        setSpeakerName(speakerId, newName);
        setDetectedSpeakers(prev =>
            prev.map(s => s.id === speakerId ? { ...s, customName: newName } : s)
        );
        // Update transcript with new name
        setTranscript(prev =>
            prev.map(seg => seg.speakerId === speakerId ? { ...seg, speakerName: newName } : seg)
        );
        setEditingSpeakerId(null);
        setEditingSpeakerName('');
    };

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

                            {/* AssemblyAI Indicator */}
                            {usingAssemblyAI && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--success)]/20 text-[var(--success)]">
                                    <Mic size={14} />
                                    <span className="text-xs">Diarização</span>
                                </div>
                            )}
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
                        currentSpeakerName={usingAssemblyAI ? activeSpeakerName : currentSpeaker?.name}
                    />
                </div>

                {/* Sidebar */}
                <aside className="w-80 p-4 space-y-4 hidden lg:block">
                    {/* Current Speaker / Active Speaker */}
                    <Card hover={false}>
                        <CardContent>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-[var(--text-muted)]">
                                    {usingAssemblyAI ? 'Falante Detectado' : 'Falando agora'}
                                </span>
                                {!usingAssemblyAI && (
                                    <Button variant="ghost" size="sm" onClick={() => setShowSpeakerModal(true)}>
                                        <RefreshCw size={14} />
                                        Trocar
                                    </Button>
                                )}
                            </div>
                            {usingAssemblyAI ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--success)] to-[var(--primary)] flex items-center justify-center">
                                        <Mic className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <span className="font-medium text-[var(--text)]">
                                            {activeSpeakerName || 'Aguardando...'}
                                        </span>
                                        <p className="text-xs text-[var(--text-muted)]">Detecção automática</p>
                                    </div>
                                </div>
                            ) : currentSpeaker ? (
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

                    {/* Detected Speakers (only when using AssemblyAI) */}
                    {usingAssemblyAI && detectedSpeakers.length > 0 && (
                        <Card hover={false}>
                            <CardContent>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-[var(--text-muted)]" />
                                        <span className="text-sm text-[var(--text-muted)]">
                                            Falantes Detectados ({detectedSpeakers.length})
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowSpeakerManagerModal(true)}
                                    >
                                        <Edit3 size={14} />
                                        Editar
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {detectedSpeakers.map((speaker) => (
                                        <div
                                            key={speaker.id}
                                            className={`
                                                flex items-center gap-2 p-2 rounded-[var(--radius-sm)]
                                                ${activeSpeakerName === speaker.customName ? 'bg-[var(--primary-subtle)]' : ''}
                                            `}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                                <span className="text-white text-sm">
                                                    {speaker.customName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-sm text-[var(--text)]">{speaker.customName}</span>
                                                <p className="text-xs text-[var(--text-muted)]">{speaker.segmentCount} falas</p>
                                            </div>
                                            {activeSpeakerName === speaker.customName && (
                                                <span className="text-xs text-[var(--primary)]">Falando</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Participants List (when not using AssemblyAI) */}
                    {!usingAssemblyAI && (
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
                    )}

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

            {/* Speaker Selection Modal (for Web Speech fallback) */}
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

            {/* Speaker Manager Modal (for renaming detected speakers) */}
            <Modal
                isOpen={showSpeakerManagerModal}
                onClose={() => {
                    setShowSpeakerManagerModal(false);
                    setEditingSpeakerId(null);
                    setEditingSpeakerName('');
                }}
                title="Gerenciar Falantes"
            >
                <div className="space-y-4">
                    <p className="text-[var(--text-secondary)]">
                        Dê nomes aos falantes detectados automaticamente.
                    </p>

                    <div className="space-y-3">
                        {detectedSpeakers.map((speaker) => (
                            <div
                                key={speaker.id}
                                className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                    <span className="text-white font-medium">
                                        {speaker.customName.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {editingSpeakerId === speaker.id ? (
                                    <div className="flex-1 flex gap-2">
                                        <Input
                                            value={editingSpeakerName}
                                            onChange={setEditingSpeakerName}
                                            placeholder="Nome do participante"
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleUpdateSpeakerName(speaker.id, editingSpeakerName)}
                                        >
                                            Salvar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingSpeakerId(null);
                                                setEditingSpeakerName('');
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1">
                                            <span className="font-medium text-[var(--text)]">{speaker.customName}</span>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {speaker.segmentCount} falas • ID: {speaker.id}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingSpeakerId(speaker.id);
                                                setEditingSpeakerName(speaker.customName);
                                            }}
                                        >
                                            <Edit3 size={14} />
                                            Renomear
                                        </Button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {detectedSpeakers.length === 0 && (
                        <p className="text-center text-[var(--text-muted)] py-4">
                            Nenhum falante detectado ainda. Comece a falar para que o sistema identifique automaticamente.
                        </p>
                    )}
                </div>
            </Modal>
        </div>
    );
}
