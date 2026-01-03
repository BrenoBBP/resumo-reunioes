// ============================================
// TRANSCRIPTION - Multi-Provider Integration
// Supports AssemblyAI (with speaker diarization) and Web Speech API
// ============================================

import { TranscriptSegment, TranscriptionConfig } from '@/types';

// Re-export AssemblyAI functions for speaker diarization
export {
    isAssemblyAIAvailable,
    startAssemblyAITranscription,
    stopAssemblyAITranscription,
    getSpeakerStats,
    setSpeakerName,
    isAssemblyAIConnected,
    getCurrentSpeaker,
} from './assemblyai';

// Provider type for selection
export type TranscriptionProvider = 'auto' | 'assemblyai' | 'webspeech';

// Current active provider
let activeProvider: TranscriptionProvider = 'auto';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
    onspeechend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

let recognition: SpeechRecognition | null = null;
let isListening = false;
let currentConfig: TranscriptionConfig | undefined;
let currentCallback: ((segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => void) | null = null;
let shouldRestart = false;

/**
 * Set the transcription provider
 */
export function setTranscriptionProvider(provider: TranscriptionProvider): void {
    activeProvider = provider;
    console.log('[Transcription] Provider set to:', provider);
}

/**
 * Get current provider
 */
export function getTranscriptionProvider(): TranscriptionProvider {
    return activeProvider;
}

/**
 * Check if Web Speech API is supported
 */
export function isWebSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Get the SpeechRecognition constructor
 */
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Start transcription streaming using Web Speech API
 * For speaker diarization, use startAssemblyAITranscription instead
 */
export function startTranscription(
    onSegment: (segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => void,
    config?: TranscriptionConfig,
    onInterimResult?: (text: string) => void
): void {
    console.log('[Transcription] Starting with config:', config);

    const SpeechRecognitionClass = getSpeechRecognition();

    if (!SpeechRecognitionClass) {
        console.error('[Transcription] Web Speech API not supported');
        onSegment({
            speakerId: 'system',
            speakerName: 'Sistema',
            text: '⚠️ Seu navegador não suporta reconhecimento de voz. Por favor, use o Google Chrome ou Microsoft Edge.',
            timestamp: Date.now(),
        });
        return;
    }

    // Stop any existing recognition
    if (recognition) {
        shouldRestart = false;
        recognition.stop();
    }

    // Create new recognition instance
    recognition = new SpeechRecognitionClass();
    currentCallback = onSegment;
    currentConfig = config;
    shouldRestart = true;

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config?.language || 'pt-BR';
    recognition.maxAlternatives = 1;

    let lastFinalText = '';

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Send interim results in real-time for display
        if (interimTranscript && onInterimResult) {
            onInterimResult(interimTranscript);
        }

        // Send final results as segments
        if (finalTranscript) {
            const cleanedText = finalTranscript.trim();
            if (cleanedText && cleanedText !== lastFinalText) {
                lastFinalText = cleanedText;
                // Clear interim display
                if (onInterimResult) {
                    onInterimResult('');
                }
                onSegment({
                    speakerId: 'user',
                    speakerName: config?.speakerName || 'Participante',
                    text: cleanedText,
                    timestamp: Date.now(),
                });
            }
        }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[Transcription] Error:', event.error, event.message);

        if (event.error === 'no-speech') {
            console.log('[Transcription] No speech detected, continuing...');
        } else if (event.error === 'audio-capture') {
            onSegment({
                speakerId: 'system',
                speakerName: 'Sistema',
                text: '⚠️ Microfone não detectado. Por favor, verifique as permissões do microfone.',
                timestamp: Date.now(),
            });
            shouldRestart = false;
        } else if (event.error === 'not-allowed') {
            onSegment({
                speakerId: 'system',
                speakerName: 'Sistema',
                text: '⚠️ Permissão de microfone negada. Por favor, permita o acesso ao microfone.',
                timestamp: Date.now(),
            });
            shouldRestart = false;
        } else if (event.error === 'network') {
            onSegment({
                speakerId: 'system',
                speakerName: 'Sistema',
                text: '⚠️ Erro de rede. Verifique sua conexão com a internet.',
                timestamp: Date.now(),
            });
        }
    };

    // Handle end - restart if needed
    recognition.onend = () => {
        console.log('[Transcription] Recognition ended');
        isListening = false;

        if (shouldRestart && recognition && currentCallback) {
            console.log('[Transcription] Auto-restarting...');
            setTimeout(() => {
                if (shouldRestart && recognition) {
                    try {
                        recognition.start();
                        isListening = true;
                    } catch (e) {
                        console.error('[Transcription] Failed to restart:', e);
                    }
                }
            }, 100);
        }
    };

    recognition.onstart = () => {
        console.log('[Transcription] Recognition started');
        isListening = true;
    };

    // Start recognition
    try {
        recognition.start();
        console.log('[Transcription] Started successfully');
    } catch (e) {
        console.error('[Transcription] Failed to start:', e);
    }
}

/**
 * Stop transcription streaming
 */
export function stopTranscription(): void {
    console.log('[Transcription] Stopping');
    shouldRestart = false;
    isListening = false;

    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.error('[Transcription] Error stopping:', e);
        }
        recognition = null;
    }

    currentCallback = null;
}

/**
 * Pause transcription
 */
export function pauseTranscription(): void {
    console.log('[Transcription] Pausing');
    shouldRestart = false;

    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.error('[Transcription] Error pausing:', e);
        }
    }

    isListening = false;
}

/**
 * Resume transcription
 */
export function resumeTranscription(
    onSegment: (segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => void
): void {
    console.log('[Transcription] Resuming');

    if (recognition) {
        currentCallback = onSegment;
        shouldRestart = true;

        try {
            recognition.start();
            isListening = true;
        } catch (e) {
            console.error('[Transcription] Error resuming:', e);
            startTranscription(onSegment, currentConfig);
        }
    } else {
        startTranscription(onSegment, currentConfig);
    }
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
    return ['pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'];
}

/**
 * Check if currently listening
 */
export function isCurrentlyListening(): boolean {
    return isListening;
}
