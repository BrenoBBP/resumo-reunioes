'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Check, User, AlertCircle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { Person } from '@/types';
import {
    VoiceProfile,
    createVoiceProfile,
    getVoiceProfile,
    startVoiceEnrollment,
    stopVoiceEnrollment,
    cancelVoiceEnrollment,
    isEnrollmentInProgress,
    getEnrolledCount,
} from '@/lib/audio/voice-enrollment';

interface VoiceEnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Person[];
    onEnrollmentComplete: (profiles: VoiceProfile[]) => void;
}

const RECORDING_DURATION = 3; // seconds

export function VoiceEnrollmentModal({
    isOpen,
    onClose,
    participants,
    onEnrollmentComplete,
}: VoiceEnrollmentModalProps) {
    const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Initialize profiles when modal opens
    useEffect(() => {
        if (isOpen && participants.length > 0) {
            const newProfiles = participants.map(p => {
                const existing = getVoiceProfile(p.id);
                if (existing) return existing;
                return createVoiceProfile(p.id, p.name);
            });
            setProfiles(newProfiles);
        }
    }, [isOpen, participants]);

    // Handle start recording
    const handleStartRecording = useCallback(async (profileId: string) => {
        setError(null);
        setRecordingId(profileId);
        setRecordingProgress(0);

        try {
            await startVoiceEnrollment(profileId, (seconds) => {
                setRecordingProgress(seconds);

                // Auto-stop after RECORDING_DURATION seconds
                if (seconds >= RECORDING_DURATION) {
                    handleStopRecording(profileId);
                }
            });
        } catch (err) {
            console.error('Failed to start enrollment:', err);
            setError('Não foi possível acessar o microfone. Verifique as permissões.');
            setRecordingId(null);
        }
    }, []);

    // Handle stop recording
    const handleStopRecording = useCallback(async (profileId: string) => {
        if (!isEnrollmentInProgress()) return;

        try {
            const updatedProfile = await stopVoiceEnrollment(profileId);
            setProfiles(prev =>
                prev.map(p => p.id === profileId ? updatedProfile : p)
            );
        } catch (err) {
            console.error('Failed to stop enrollment:', err);
            setError('Erro ao processar gravação. Tente novamente.');
        } finally {
            setRecordingId(null);
            setRecordingProgress(0);
        }
    }, []);

    // Handle cancel
    const handleCancel = useCallback(() => {
        if (isEnrollmentInProgress()) {
            cancelVoiceEnrollment();
        }
        setRecordingId(null);
        setRecordingProgress(0);
        onClose();
    }, [onClose]);

    // Handle complete
    const handleComplete = useCallback(() => {
        const enrolledProfiles = profiles.filter(p => p.enrolled);
        if (enrolledProfiles.length > 0) {
            onEnrollmentComplete(enrolledProfiles);
        }
        onClose();
    }, [profiles, onEnrollmentComplete, onClose]);

    const enrolledCount = profiles.filter(p => p.enrolled).length;
    const allEnrolled = enrolledCount === profiles.length && profiles.length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            title="Cadastrar Vozes"
            size="md"
        >
            <div className="space-y-4">
                <p className="text-[var(--text-secondary)]">
                    Para identificar automaticamente quem está falando, grave uma amostra de voz de cada participante.
                </p>

                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-red-500/10 border border-red-500/20">
                        <AlertCircle className="text-red-500" size={18} />
                        <span className="text-red-400 text-sm">{error}</span>
                    </div>
                )}

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                        {profiles.map((profile, index) => (
                            <motion.div
                                key={profile.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    flex items-center gap-3 p-4 rounded-[var(--radius-md)]
                                    border transition-all
                                    ${profile.enrolled
                                        ? 'bg-[var(--success)]/10 border-[var(--success)]/30'
                                        : recordingId === profile.id
                                            ? 'bg-[var(--recording)]/10 border-[var(--recording)]/30'
                                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)]'
                                    }
                                `}
                            >
                                {/* Avatar */}
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center
                                    ${profile.enrolled
                                        ? 'bg-[var(--success)]'
                                        : 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]'
                                    }
                                `}>
                                    {profile.enrolled ? (
                                        <Check className="text-white" size={24} />
                                    ) : (
                                        <span className="text-white font-semibold text-lg">
                                            {profile.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Name and Status */}
                                <div className="flex-1">
                                    <span className="font-medium text-[var(--text)]">
                                        {profile.name}
                                    </span>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {profile.enrolled
                                            ? '✓ Voz cadastrada'
                                            : recordingId === profile.id
                                                ? `Gravando... ${recordingProgress.toFixed(1)}s`
                                                : 'Pendente'
                                        }
                                    </p>
                                </div>

                                {/* Recording Progress */}
                                {recordingId === profile.id && (
                                    <div className="w-16">
                                        <div className="h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[var(--recording)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(recordingProgress / RECORDING_DURATION) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Record Button */}
                                <Button
                                    variant={recordingId === profile.id ? 'danger' : profile.enrolled ? 'ghost' : 'primary'}
                                    size="sm"
                                    onClick={() => {
                                        if (recordingId === profile.id) {
                                            handleStopRecording(profile.id);
                                        } else if (!recordingId) {
                                            handleStartRecording(profile.id);
                                        }
                                    }}
                                    disabled={recordingId !== null && recordingId !== profile.id}
                                >
                                    {recordingId === profile.id ? (
                                        <>
                                            <MicOff size={16} />
                                            Parar
                                        </>
                                    ) : profile.enrolled ? (
                                        <>
                                            <Mic size={16} />
                                            Regravar
                                        </>
                                    ) : (
                                        <>
                                            <Mic size={16} />
                                            Gravar
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Instructions */}
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--primary-subtle)] border border-[var(--primary)]/20">
                    <p className="text-sm text-[var(--text)]">
                        <strong>Dica:</strong> Peça para cada pessoa dizer uma frase como &quot;Meu nome é [Nome] e vou participar desta reunião&quot;.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-[var(--text-muted)]">
                        {enrolledCount} de {profiles.length} cadastrados
                    </span>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleCancel}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleComplete}
                            disabled={enrolledCount === 0}
                        >
                            {allEnrolled ? 'Iniciar Reunião' : 'Continuar'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
