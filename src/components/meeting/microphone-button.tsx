'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Users, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input } from '@/components/ui';
import { useMeetingStore } from '@/stores/meeting-store';
import { Person } from '@/types';
import { mockPeople } from '@/lib/storage/mock-data';

export function MicrophoneButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <motion.button
                onClick={() => setIsModalOpen(true)}
                className={`
          relative w-32 h-32 rounded-full
          bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]
          flex items-center justify-center
          shadow-[var(--shadow-glow)]
          cursor-pointer
        `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    boxShadow: [
                        '0 0 20px var(--primary-glow)',
                        '0 0 40px var(--primary-glow)',
                        '0 0 20px var(--primary-glow)',
                    ],
                }}
                transition={{
                    boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    },
                }}
            >
                {/* Outer ring animation */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[var(--primary)]"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />

                <Mic size={48} className="text-white" />
            </motion.button>

            <SpeakerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

interface SpeakerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function SpeakerModal({ isOpen, onClose }: SpeakerModalProps) {
    const router = useRouter();
    const { people, addPerson, createMeeting, setCurrentSpeaker } = useMeetingStore();
    const [showNewPerson, setShowNewPerson] = useState(false);
    const [newPersonName, setNewPersonName] = useState('');

    // Use mock people if store is empty
    const availablePeople = people.length > 0 ? people : mockPeople;

    const handleSelectPerson = (person: Person) => {
        const meeting = createMeeting('Nova Reunião', [person]);
        setCurrentSpeaker(person);
        onClose();
        router.push(`/meeting/${meeting.id}`);
    };

    const handleCreatePerson = () => {
        if (!newPersonName.trim()) return;

        const person = addPerson(newPersonName.trim());
        setNewPersonName('');
        setShowNewPerson(false);
        handleSelectPerson(person);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Quem vai falar?" size="md">
            <div className="space-y-4">
                <p className="text-[var(--text-secondary)]">
                    Selecione a pessoa que vai iniciar a reunião ou crie uma nova.
                </p>

                {/* Existing People List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availablePeople.map((person) => (
                        <motion.button
                            key={person.id}
                            onClick={() => handleSelectPerson(person)}
                            className={`
                w-full flex items-center gap-3 p-3
                bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)]
                border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]
                rounded-[var(--radius-md)]
                transition-all duration-[var(--duration-normal)]
                text-left
              `}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                                <span className="text-white font-medium">
                                    {person.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <span className="font-medium text-[var(--text)]">{person.name}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-[var(--glass-border)]" />
                    <span className="text-sm text-[var(--text-muted)]">ou</span>
                    <div className="flex-1 h-px bg-[var(--glass-border)]" />
                </div>

                {/* Add New Person */}
                {showNewPerson ? (
                    <div className="space-y-3">
                        <Input
                            placeholder="Nome da pessoa"
                            value={newPersonName}
                            onChange={setNewPersonName}
                            icon={<Users size={18} />}
                        />
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setShowNewPerson(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleCreatePerson} className="flex-1">
                                Criar e Iniciar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="secondary"
                        onClick={() => setShowNewPerson(true)}
                        className="w-full"
                    >
                        <UserPlus size={18} />
                        Nova Pessoa
                    </Button>
                )}
            </div>
        </Modal>
    );
}
