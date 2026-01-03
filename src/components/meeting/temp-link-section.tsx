'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, QrCode, Check, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface TempLinkSectionProps {
    meetingId: string;
}

export function TempLinkSection({ meetingId }: TempLinkSectionProps) {
    const [isGenerated, setIsGenerated] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate fake temporary link
    const tempCode = `RN${meetingId.substring(0, 6).toUpperCase()}`;
    const tempLink = `https://reuniao.app/join/${tempCode}`;

    const handleGenerateLink = () => {
        setIsGenerated(true);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(tempLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="mt-4" hover={false}>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                    <Link2 size={18} className="text-[var(--primary)]" />
                    <h3 className="font-medium text-[var(--text)]">Link Temporário</h3>
                </div>

                {!isGenerated ? (
                    <div className="space-y-2">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Gere um link para outros participantes captarem áudio remotamente.
                        </p>
                        <Button variant="secondary" onClick={handleGenerateLink} className="w-full">
                            <Link2 size={16} />
                            Gerar Link
                        </Button>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        {/* Link Display */}
                        <div className="flex items-center gap-2 p-2 bg-[var(--surface)] rounded-[var(--radius-sm)] border border-[var(--glass-border)]">
                            <code className="flex-1 text-xs text-[var(--primary)] truncate">
                                {tempLink}
                            </code>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCopy}
                                className="shrink-0"
                            >
                                {copied ? <Check size={16} className="text-[var(--success)]" /> : <Copy size={16} />}
                            </Button>
                        </div>

                        {/* QR Code Placeholder */}
                        <div className="flex items-center justify-center p-4 bg-white rounded-[var(--radius-md)]">
                            <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                                <QrCode size={48} className="text-gray-400" />
                            </div>
                        </div>

                        {/* Code Display */}
                        <div className="text-center">
                            <p className="text-sm text-[var(--text-muted)]">Código de acesso</p>
                            <p className="font-mono text-2xl font-bold text-[var(--primary)]">{tempCode}</p>
                        </div>

                        {/* Instructions */}
                        <div className="p-3 bg-[var(--primary-subtle)] rounded-[var(--radius-sm)]">
                            <p className="text-xs text-[var(--text-secondary)]">
                                <strong className="text-[var(--text)]">Instruções:</strong> Compartilhe o link ou código com outros participantes.
                                Eles poderão acessar pelo celular para capturar áudio.
                            </p>
                        </div>

                        <Button variant="ghost" size="sm" className="w-full" onClick={() => window.open(tempLink, '_blank')}>
                            <ExternalLink size={14} />
                            Testar Link
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
