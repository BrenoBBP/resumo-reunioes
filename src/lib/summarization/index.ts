// ============================================
// SUMMARIZATION STUBS
// For future integration with LLM API
// ============================================

import { TranscriptSegment, MeetingSummary, SummarizationOptions } from '@/types';

// Mock summaries for demo
const mockSummaries: Record<string, MeetingSummary> = {
    default: {
        topics: [
            "Andamento do projeto e cronograma",
            "Revisão de requisitos do cliente",
            "Orçamento do próximo trimestre",
            "Coordenação de entregas",
        ],
        decisions: [
            "Agendar call com o cliente esta semana para alinhamento",
            "Documento final deve ser entregue até sexta-feira",
            "Orçamento será discutido na próxima reunião",
        ],
        nextSteps: [
            "João: Preparar material para reunião com cliente",
            "Maria: Revisar documento de requisitos",
            "Equipe: Atualizar status no board do projeto",
            "Gerência: Validar cronograma ajustado",
        ],
        risks: [
            "Possível atraso se requisitos mudarem significativamente",
            "Dependência de aprovação do cliente para próxima fase",
        ],
    },
};

/**
 * STUB: Generate summary from transcript
 * Future: Send to LLM API (OpenAI, Anthropic, etc.)
 */
export async function generateSummary(
    transcript: TranscriptSegment[],
    options?: SummarizationOptions
): Promise<MeetingSummary> {
    console.log('[Summarization Stub] Generating summary for', transcript.length, 'segments');
    console.log('[Summarization Stub] Options:', options);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return mock summary
    return mockSummaries.default;
}

/**
 * STUB: Generate action items from transcript
 */
export async function extractActionItems(
    transcript: TranscriptSegment[]
): Promise<string[]> {
    console.log('[Summarization Stub] Extracting action items');

    await new Promise((resolve) => setTimeout(resolve, 800));

    return mockSummaries.default.nextSteps;
}

/**
 * STUB: Generate key topics from transcript
 */
export async function extractTopics(
    transcript: TranscriptSegment[]
): Promise<string[]> {
    console.log('[Summarization Stub] Extracting topics');

    await new Promise((resolve) => setTimeout(resolve, 600));

    return mockSummaries.default.topics;
}

/**
 * STUB: Identify speakers from transcript (speaker diarization)
 */
export async function identifySpeakers(
    transcript: TranscriptSegment[]
): Promise<string[]> {
    console.log('[Summarization Stub] Identifying speakers');

    return [...new Set(transcript.map((s) => s.speakerName))];
}
