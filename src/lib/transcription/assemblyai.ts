// ============================================
// ASSEMBLYAI PROVIDER - Real-time Speaker Diarization
// Uses WebSocket for streaming transcription
// ============================================

import { TranscriptSegment } from '@/types';

interface AssemblyAIConfig {
    language?: string;
    onSpeakerChange?: (speaker: string) => void;
}

interface RealtimeMessage {
    message_type: string;
    text?: string;
    words?: Array<{
        text: string;
        start: number;
        end: number;
        confidence: number;
        speaker?: string;
    }>;
    audio_start?: number;
    audio_end?: number;
    created?: string;
}

let websocket: WebSocket | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioContext: AudioContext | null = null;
let isConnected = false;
let currentSpeaker = 'Speaker A';
let speakerMap: Map<string, string> = new Map();
let speakerCounter = 0;

/**
 * Check if AssemblyAI is available (API key configured)
 */
export async function isAssemblyAIAvailable(): Promise<boolean> {
    try {
        const response = await fetch('/api/transcribe');
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get a friendly speaker name from AssemblyAI speaker ID
 */
function getSpeakerName(speakerId: string): string {
    if (!speakerMap.has(speakerId)) {
        speakerCounter++;
        speakerMap.set(speakerId, `Participante ${speakerCounter}`);
    }
    return speakerMap.get(speakerId) || speakerId;
}

/**
 * Start real-time transcription with AssemblyAI
 */
export async function startAssemblyAITranscription(
    onSegment: (segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => void,
    config?: AssemblyAIConfig
): Promise<boolean> {
    console.log('[AssemblyAI] Starting real-time transcription');

    // Reset speaker tracking
    speakerMap.clear();
    speakerCounter = 0;

    try {
        // Step 1: Get temporary token from our API
        const tokenResponse = await fetch('/api/transcribe');
        if (!tokenResponse.ok) {
            console.error('[AssemblyAI] Failed to get token');
            return false;
        }
        const { token } = await tokenResponse.json();

        // Step 2: Connect to AssemblyAI WebSocket
        const wsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`;
        websocket = new WebSocket(wsUrl);

        websocket.onopen = () => {
            console.log('[AssemblyAI] WebSocket connected');
            isConnected = true;
            startAudioCapture(onSegment, config);
        };

        websocket.onmessage = (event) => {
            const message: RealtimeMessage = JSON.parse(event.data);

            if (message.message_type === 'FinalTranscript' && message.text) {
                // Detect speaker from words if available
                const detectedSpeaker = message.words?.[0]?.speaker || 'A';
                const speakerName = getSpeakerName(detectedSpeaker);

                if (currentSpeaker !== speakerName) {
                    currentSpeaker = speakerName;
                    config?.onSpeakerChange?.(speakerName);
                }

                onSegment({
                    speakerId: detectedSpeaker,
                    speakerName: speakerName,
                    text: message.text,
                    timestamp: Date.now(),
                });
            }
        };

        websocket.onerror = (error) => {
            console.error('[AssemblyAI] WebSocket error:', error);
            isConnected = false;
        };

        websocket.onclose = () => {
            console.log('[AssemblyAI] WebSocket closed');
            isConnected = false;
        };

        return true;
    } catch (error) {
        console.error('[AssemblyAI] Failed to start:', error);
        return false;
    }
}

/**
 * Start audio capture and send to WebSocket
 */
async function startAudioCapture(
    onSegment: (segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => void,
    config?: AssemblyAIConfig
): Promise<void> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true,
            },
        });

        audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (event) => {
            if (!isConnected || !websocket || websocket.readyState !== WebSocket.OPEN) {
                return;
            }

            const inputData = event.inputBuffer.getChannelData(0);
            const pcmData = convertFloat32ToInt16(inputData);
            // Create a new ArrayBuffer from the Int16Array to avoid SharedArrayBuffer type issues
            const buffer = pcmData.buffer.slice(0) as ArrayBuffer;
            const base64Audio = arrayBufferToBase64(buffer);

            websocket.send(JSON.stringify({
                audio_data: base64Audio,
            }));
        };

        // Store for cleanup
        mediaRecorder = { stream, processor, source } as unknown as MediaRecorder;

        // Notify that we're ready
        onSegment({
            speakerId: 'system',
            speakerName: 'Sistema',
            text: '🎙️ Transcrição com identificação de falantes iniciada',
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('[AssemblyAI] Audio capture error:', error);
        onSegment({
            speakerId: 'system',
            speakerName: 'Sistema',
            text: '⚠️ Erro ao acessar microfone. Verifique as permissões.',
            timestamp: Date.now(),
        });
    }
}

/**
 * Stop AssemblyAI transcription
 */
export function stopAssemblyAITranscription(): void {
    console.log('[AssemblyAI] Stopping transcription');

    if (websocket) {
        websocket.close();
        websocket = null;
    }

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    if (mediaRecorder) {
        const recorder = mediaRecorder as unknown as {
            stream: MediaStream;
            processor: ScriptProcessorNode;
            source: MediaStreamAudioSourceNode;
        };
        recorder.stream.getTracks().forEach((track) => track.stop());
        recorder.processor.disconnect();
        recorder.source.disconnect();
        mediaRecorder = null;
    }

    isConnected = false;
}

/**
 * Get speaker statistics
 */
export function getSpeakerStats(): { speaker: string; count: number }[] {
    return Array.from(speakerMap.entries()).map(([id, name]) => ({
        speaker: name,
        count: 0, // Will be calculated from transcript
    }));
}

/**
 * Set custom speaker names (after user identifies them)
 */
export function setSpeakerName(speakerId: string, customName: string): void {
    speakerMap.set(speakerId, customName);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function convertFloat32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Check if currently connected
 */
export function isAssemblyAIConnected(): boolean {
    return isConnected;
}

/**
 * Get current detected speaker
 */
export function getCurrentSpeaker(): string {
    return currentSpeaker;
}
