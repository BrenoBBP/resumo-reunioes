// ============================================
// VOICE ENROLLMENT - Free Voice Identification
// Uses Web Audio API to create voice profiles
// ============================================

export interface VoiceProfile {
    id: string;
    name: string;
    enrolled: boolean;
    // Audio features for matching
    features: VoiceFeatures | null;
    sampleBlob?: Blob;
}

export interface VoiceFeatures {
    // Average pitch (fundamental frequency)
    avgPitch: number;
    // Pitch variance
    pitchVariance: number;
    // Average energy/volume
    avgEnergy: number;
    // Zero crossing rate (voice characteristic)
    zeroCrossingRate: number;
    // Spectral centroid (brightness of voice)
    spectralCentroid: number;
    // Duration of sample
    sampleDuration: number;
}

interface RecordingState {
    isRecording: boolean;
    stream: MediaStream | null;
    audioContext: AudioContext | null;
    analyser: AnalyserNode | null;
    mediaRecorder: MediaRecorder | null;
    chunks: Blob[];
}

let recordingState: RecordingState = {
    isRecording: false,
    stream: null,
    audioContext: null,
    analyser: null,
    mediaRecorder: null,
    chunks: [],
};

// Store enrolled voice profiles
let voiceProfiles: Map<string, VoiceProfile> = new Map();

/**
 * Initialize a voice profile for a participant
 */
export function createVoiceProfile(id: string, name: string): VoiceProfile {
    const profile: VoiceProfile = {
        id,
        name,
        enrolled: false,
        features: null,
    };
    voiceProfiles.set(id, profile);
    return profile;
}

/**
 * Get all voice profiles
 */
export function getVoiceProfiles(): VoiceProfile[] {
    return Array.from(voiceProfiles.values());
}

/**
 * Get a specific voice profile
 */
export function getVoiceProfile(id: string): VoiceProfile | undefined {
    return voiceProfiles.get(id);
}

/**
 * Clear all voice profiles
 */
export function clearVoiceProfiles(): void {
    voiceProfiles.clear();
}

/**
 * Start recording a voice sample for enrollment
 */
export async function startVoiceEnrollment(
    profileId: string,
    onProgress?: (seconds: number) => void
): Promise<void> {
    const profile = voiceProfiles.get(profileId);
    if (!profile) {
        throw new Error('Profile not found');
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 44100,
                echoCancellation: true,
                noiseSuppression: true,
            },
        });

        const audioContext = new AudioContext({ sampleRate: 44100 });
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
        });

        recordingState = {
            isRecording: true,
            stream,
            audioContext,
            analyser,
            mediaRecorder,
            chunks: [],
        };

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordingState.chunks.push(event.data);
            }
        };

        mediaRecorder.start(100);

        // Progress callback
        let seconds = 0;
        const progressInterval = setInterval(() => {
            seconds += 0.1;
            onProgress?.(seconds);
        }, 100);

        // Store interval for cleanup
        (recordingState as unknown as { progressInterval: NodeJS.Timeout }).progressInterval = progressInterval;

        console.log('[VoiceEnrollment] Started recording for:', profile.name);
    } catch (error) {
        console.error('[VoiceEnrollment] Failed to start recording:', error);
        throw error;
    }
}

/**
 * Stop recording and process the voice sample
 */
export async function stopVoiceEnrollment(profileId: string): Promise<VoiceProfile> {
    const profile = voiceProfiles.get(profileId);
    if (!profile) {
        throw new Error('Profile not found');
    }

    if (!recordingState.isRecording || !recordingState.mediaRecorder) {
        throw new Error('Not recording');
    }

    return new Promise((resolve, reject) => {
        const { mediaRecorder, stream, audioContext, analyser, chunks } = recordingState;

        // Clear progress interval
        const progressInterval = (recordingState as unknown as { progressInterval: NodeJS.Timeout }).progressInterval;
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        mediaRecorder!.onstop = async () => {
            try {
                // Create blob from chunks
                const blob = new Blob(chunks, { type: 'audio/webm' });

                // Extract voice features
                const features = await extractVoiceFeatures(blob, audioContext!, analyser!);

                // Update profile
                profile.enrolled = true;
                profile.features = features;
                profile.sampleBlob = blob;
                voiceProfiles.set(profileId, profile);

                // Cleanup
                stream?.getTracks().forEach(track => track.stop());
                audioContext?.close();

                recordingState = {
                    isRecording: false,
                    stream: null,
                    audioContext: null,
                    analyser: null,
                    mediaRecorder: null,
                    chunks: [],
                };

                console.log('[VoiceEnrollment] Enrolled:', profile.name, 'Features:', features);
                resolve(profile);
            } catch (error) {
                reject(error);
            }
        };

        mediaRecorder!.stop();
    });
}

/**
 * Cancel ongoing enrollment
 */
export function cancelVoiceEnrollment(): void {
    if (recordingState.isRecording) {
        const progressInterval = (recordingState as unknown as { progressInterval: NodeJS.Timeout }).progressInterval;
        if (progressInterval) {
            clearInterval(progressInterval);
        }

        recordingState.stream?.getTracks().forEach(track => track.stop());
        recordingState.audioContext?.close();
        recordingState.mediaRecorder?.stop();

        recordingState = {
            isRecording: false,
            stream: null,
            audioContext: null,
            analyser: null,
            mediaRecorder: null,
            chunks: [],
        };
    }
}

/**
 * Extract voice features from audio blob
 */
async function extractVoiceFeatures(
    blob: Blob,
    audioContext: AudioContext,
    analyser: AnalyserNode
): Promise<VoiceFeatures> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    // Calculate features
    const avgPitch = estimatePitch(channelData, audioBuffer.sampleRate);
    const pitchVariance = calculatePitchVariance(channelData, audioBuffer.sampleRate);
    const avgEnergy = calculateAverageEnergy(channelData);
    const zeroCrossingRate = calculateZeroCrossingRate(channelData);
    const spectralCentroid = calculateSpectralCentroid(channelData, audioBuffer.sampleRate);

    return {
        avgPitch,
        pitchVariance,
        avgEnergy,
        zeroCrossingRate,
        spectralCentroid,
        sampleDuration: audioBuffer.duration,
    };
}

/**
 * Estimate pitch using autocorrelation
 */
function estimatePitch(data: Float32Array, sampleRate: number): number {
    const minFreq = 50; // Min human voice frequency
    const maxFreq = 400; // Max human voice frequency
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let bestCorrelation = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period <= maxPeriod; period++) {
        let correlation = 0;
        for (let i = 0; i < data.length - period; i++) {
            correlation += data[i] * data[i + period];
        }
        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestPeriod = period;
        }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
}

/**
 * Calculate pitch variance
 */
function calculatePitchVariance(data: Float32Array, sampleRate: number): number {
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    const pitches: number[] = [];

    for (let start = 0; start < data.length - windowSize; start += windowSize) {
        const window = data.slice(start, start + windowSize);
        const pitch = estimatePitch(window, sampleRate);
        if (pitch > 0) {
            pitches.push(pitch);
        }
    }

    if (pitches.length === 0) return 0;

    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / pitches.length;
    return Math.sqrt(variance);
}

/**
 * Calculate average energy (RMS)
 */
function calculateAverageEnergy(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
}

/**
 * Calculate zero crossing rate
 */
function calculateZeroCrossingRate(data: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
        if ((data[i] >= 0 && data[i - 1] < 0) || (data[i] < 0 && data[i - 1] >= 0)) {
            crossings++;
        }
    }
    return crossings / data.length;
}

/**
 * Calculate spectral centroid
 */
function calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
    const fftSize = 2048;
    const fft = new Float32Array(fftSize);

    // Simple DFT for first fftSize samples
    for (let k = 0; k < fftSize / 2; k++) {
        let real = 0;
        let imag = 0;
        for (let n = 0; n < Math.min(data.length, fftSize); n++) {
            const angle = (2 * Math.PI * k * n) / fftSize;
            real += data[n] * Math.cos(angle);
            imag += data[n] * Math.sin(angle);
        }
        fft[k] = Math.sqrt(real * real + imag * imag);
    }

    let weightedSum = 0;
    let sum = 0;
    for (let i = 0; i < fftSize / 2; i++) {
        const frequency = (i * sampleRate) / fftSize;
        weightedSum += frequency * fft[i];
        sum += fft[i];
    }

    return sum > 0 ? weightedSum / sum : 0;
}

/**
 * Match incoming audio against enrolled profiles
 * Returns the best matching profile or null
 */
export function matchVoice(features: VoiceFeatures): VoiceProfile | null {
    const profiles = getVoiceProfiles().filter(p => p.enrolled && p.features);

    if (profiles.length === 0) return null;

    let bestMatch: VoiceProfile | null = null;
    let bestScore = Infinity;

    for (const profile of profiles) {
        const score = calculateSimilarityScore(features, profile.features!);
        if (score < bestScore) {
            bestScore = score;
            bestMatch = profile;
        }
    }

    // Threshold for matching (lower is better)
    const MATCH_THRESHOLD = 0.5;

    if (bestScore < MATCH_THRESHOLD) {
        console.log('[VoiceEnrollment] Matched:', bestMatch?.name, 'Score:', bestScore);
        return bestMatch;
    }

    console.log('[VoiceEnrollment] No match found. Best score:', bestScore);
    return null;
}

/**
 * Calculate similarity score between two voice feature sets
 * Lower score = more similar
 */
function calculateSimilarityScore(a: VoiceFeatures, b: VoiceFeatures): number {
    // Normalize and weight different features
    const pitchDiff = Math.abs(a.avgPitch - b.avgPitch) / Math.max(a.avgPitch, b.avgPitch, 1);
    const varianceDiff = Math.abs(a.pitchVariance - b.pitchVariance) / Math.max(a.pitchVariance, b.pitchVariance, 1);
    const energyDiff = Math.abs(a.avgEnergy - b.avgEnergy) / Math.max(a.avgEnergy, b.avgEnergy, 0.001);
    const zcrDiff = Math.abs(a.zeroCrossingRate - b.zeroCrossingRate) / Math.max(a.zeroCrossingRate, b.zeroCrossingRate, 0.001);
    const centroidDiff = Math.abs(a.spectralCentroid - b.spectralCentroid) / Math.max(a.spectralCentroid, b.spectralCentroid, 1);

    // Weighted average (pitch is most important for speaker ID)
    const score = (
        pitchDiff * 0.35 +
        varianceDiff * 0.2 +
        energyDiff * 0.15 +
        zcrDiff * 0.15 +
        centroidDiff * 0.15
    );

    return score;
}

/**
 * Check if enrollment is in progress
 */
export function isEnrollmentInProgress(): boolean {
    return recordingState.isRecording;
}

/**
 * Get number of enrolled profiles
 */
export function getEnrolledCount(): number {
    return getVoiceProfiles().filter(p => p.enrolled).length;
}
