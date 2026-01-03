// ============================================
// ASSEMBLYAI API ROUTE
// Proxy for real-time transcription with speaker diarization
// ============================================

import { NextRequest, NextResponse } from 'next/server';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

/**
 * GET: Create a temporary WebSocket token for real-time transcription
 */
export async function GET() {
    if (!ASSEMBLYAI_API_KEY) {
        return NextResponse.json(
            { error: 'AssemblyAI API key not configured' },
            { status: 500 }
        );
    }

    try {
        // Request temporary auth token for WebSocket connection
        const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                expires_in: 3600, // 1 hour
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[AssemblyAI] Token error:', error);
            return NextResponse.json(
                { error: 'Failed to get transcription token' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ token: data.token });
    } catch (error) {
        console.error('[AssemblyAI] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST: Transcribe uploaded audio file with speaker diarization
 */
export async function POST(request: NextRequest) {
    if (!ASSEMBLYAI_API_KEY) {
        return NextResponse.json(
            { error: 'AssemblyAI API key not configured' },
            { status: 500 }
        );
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Step 1: Upload the audio file
        const audioBuffer = await audioFile.arrayBuffer();
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': 'application/octet-stream',
            },
            body: audioBuffer,
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload audio');
        }

        const { upload_url } = await uploadResponse.json();

        // Step 2: Request transcription with speaker diarization
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: upload_url,
                language_code: 'pt',
                speaker_labels: true, // Enable speaker diarization
                speakers_expected: 10, // Max expected speakers
            }),
        });

        if (!transcriptResponse.ok) {
            throw new Error('Failed to start transcription');
        }

        const transcript = await transcriptResponse.json();

        // Step 3: Poll for completion
        let result = transcript;
        while (result.status !== 'completed' && result.status !== 'error') {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const pollResponse = await fetch(
                `https://api.assemblyai.com/v2/transcript/${result.id}`,
                {
                    headers: {
                        'Authorization': ASSEMBLYAI_API_KEY,
                    },
                }
            );
            result = await pollResponse.json();
        }

        if (result.status === 'error') {
            throw new Error(result.error || 'Transcription failed');
        }

        // Format response with speaker labels
        const segments = result.utterances?.map((utterance: {
            speaker: string;
            text: string;
            start: number;
            end: number;
            confidence: number;
        }) => ({
            speaker: utterance.speaker,
            text: utterance.text,
            start: utterance.start,
            end: utterance.end,
            confidence: utterance.confidence,
        })) || [];

        return NextResponse.json({
            success: true,
            segments,
            speakers: [...new Set(segments.map((s: { speaker: string }) => s.speaker))],
        });
    } catch (error) {
        console.error('[AssemblyAI] Transcription error:', error);
        return NextResponse.json(
            { error: 'Transcription failed' },
            { status: 500 }
        );
    }
}
