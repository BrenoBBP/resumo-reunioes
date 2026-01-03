'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MicrophoneButton } from '@/components/meeting';
import { LayoutDashboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--surface)] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-glow pointer-events-none opacity-50" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[var(--primary)]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-semibold text-[var(--text)] text-lg">
              Resumo IA
            </span>
          </Link>

          <Link href="/dashboard">
            <Button variant="secondary" size="md">
              <LayoutDashboard size={18} />
              Dashboard
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--text)] mb-4">
            Resumo de <span className="text-gradient">Reuniões</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-xl mx-auto">
            Capture, transcreva e resuma suas reuniões com inteligência artificial.
            Nunca mais perca um detalhe importante.
          </p>
        </motion.div>

        {/* Microphone Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MicrophoneButton />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-sm text-[var(--text-muted)]"
        >
          Clique no microfone para iniciar uma nova reunião
        </motion.p>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full px-4"
        >
          {[
            { title: 'Transcrição em Tempo Real', desc: 'Veja o que está sendo dito instantaneamente' },
            { title: 'Resumo Inteligente', desc: 'IA extrai tópicos, decisões e próximos passos' },
            { title: 'Organização por Pastas', desc: 'Encontre qualquer reunião por pessoa ou assunto' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="glass-card p-5"
              whileHover={{ y: -4 }}
            >
              <h3 className="font-semibold text-[var(--text)] mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
