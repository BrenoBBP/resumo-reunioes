'use client';

import { Settings, Globe, Palette, Database, Info } from 'lucide-react';
import { Topbar } from '@/components/layout';
import { Card, CardContent, CardHeader } from '@/components/ui';

export default function SettingsPage() {
    return (
        <div className="min-h-screen">
            <Topbar title="Configurações" showNewMeeting={false} />

            <div className="p-6 max-w-2xl">
                <div className="space-y-6">
                    <Card hover={false}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Settings size={20} className="text-[var(--primary)]" />
                                <h2 className="font-semibold text-[var(--text)]">Geral</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SettingItem icon={<Globe size={18} />} title="Idioma" value="Português (BR)" />
                            <SettingItem icon={<Palette size={18} />} title="Tema" value="Escuro" />
                        </CardContent>
                    </Card>

                    <Card hover={false}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Database size={20} className="text-[var(--primary)]" />
                                <h2 className="font-semibold text-[var(--text)]">Dados</h2>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <SettingItem icon={<Database size={18} />} title="Armazenamento" value="LocalStorage" />
                            <p className="text-sm text-[var(--text-muted)] mt-4">
                                Exportação e sincronização disponíveis em breve.
                            </p>
                        </CardContent>
                    </Card>

                    <Card hover={false}>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Info size={20} className="text-[var(--primary)]" />
                                <h2 className="font-semibold text-[var(--text)]">Sobre</h2>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between mb-2">
                                <span className="text-[var(--text-secondary)]">Versão</span>
                                <span className="text-[var(--text)]">1.0.0 (V1)</span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mt-4">
                                Próximas features: áudio real, transcrição AI, resumo LLM, WebRTC.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function SettingItem({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
                <span className="text-[var(--text-muted)]">{icon}</span>
                <span className="font-medium text-[var(--text)]">{title}</span>
            </div>
            <span className="text-sm text-[var(--text-muted)]">{value} (em breve)</span>
        </div>
    );
}
