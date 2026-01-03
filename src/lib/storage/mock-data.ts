// ============================================
// MOCK DATA
// Sample data for UI development and demos
// ============================================

import { Meeting, Person, TopicTag, MeetingSummary } from '@/types';

// Sample People
export const mockPeople: Person[] = [
    { id: 'p1', name: 'João Silva', createdAt: new Date('2024-01-15') },
    { id: 'p2', name: 'Maria Santos', createdAt: new Date('2024-01-15') },
    { id: 'p3', name: 'Pedro Costa', createdAt: new Date('2024-01-20') },
    { id: 'p4', name: 'Ana Oliveira', createdAt: new Date('2024-02-01') },
    { id: 'p5', name: 'Carlos Lima', createdAt: new Date('2024-02-10') },
];

// Sample Tags
export const mockTags: TopicTag[] = [
    { id: 't1', name: 'Projeto Alpha', color: 'indigo', createdAt: new Date('2024-01-10') },
    { id: 't2', name: 'Vendas', color: 'green', createdAt: new Date('2024-01-10') },
    { id: 't3', name: 'Marketing', color: 'purple', createdAt: new Date('2024-01-15') },
    { id: 't4', name: 'RH', color: 'orange', createdAt: new Date('2024-01-20') },
    { id: 't5', name: 'Financeiro', color: 'blue', createdAt: new Date('2024-02-01') },
];

// Sample Summary
const sampleSummary: MeetingSummary = {
    topics: [
        'Revisão do progresso do Projeto Alpha',
        'Discussão sobre cronograma de entregas',
        'Alocação de recursos para Q2',
        'Feedback do cliente sobre protótipo',
    ],
    decisions: [
        'Estender deadline da fase 1 em uma semana',
        'Contratar mais um desenvolvedor frontend',
        'Agendar demo com cliente para próxima quinta',
    ],
    nextSteps: [
        'João: Finalizar documentação técnica até sexta',
        'Maria: Preparar apresentação para demo',
        'Pedro: Revisar código do módulo de pagamentos',
        'Ana: Coordenar com RH a contratação',
    ],
    risks: [
        'Possível indisponibilidade do servidor de staging',
        'Dependência de API terceira sem fallback',
    ],
};

// Sample Meetings
export const mockMeetings: Meeting[] = [
    {
        id: 'm1',
        title: 'Kickoff Projeto Alpha',
        participants: [mockPeople[0], mockPeople[1], mockPeople[2]],
        tags: [mockTags[0]],
        transcript: [
            { id: 'ts1', speakerId: 'p1', speakerName: 'João Silva', text: 'Bom dia a todos, vamos dar início ao projeto Alpha.', timestamp: 0, createdAt: new Date() },
            { id: 'ts2', speakerId: 'p2', speakerName: 'Maria Santos', text: 'Preparei uma apresentação com o escopo inicial.', timestamp: 15, createdAt: new Date() },
            { id: 'ts3', speakerId: 'p3', speakerName: 'Pedro Costa', text: 'Vou compartilhar os requisitos técnicos que levantei.', timestamp: 30, createdAt: new Date() },
        ],
        summary: sampleSummary,
        duration: 3600, // 1 hour
        createdAt: new Date('2024-12-20'),
        status: 'completed',
    },
    {
        id: 'm2',
        title: 'Sprint Planning - Semana 52',
        participants: [mockPeople[0], mockPeople[2], mockPeople[4]],
        tags: [mockTags[0]],
        transcript: [
            { id: 'ts4', speakerId: 'p1', speakerName: 'João Silva', text: 'Vamos revisar as tasks para esta sprint.', timestamp: 0, createdAt: new Date() },
            { id: 'ts5', speakerId: 'p3', speakerName: 'Pedro Costa', text: 'Temos 15 pontos de histórias pendentes.', timestamp: 10, createdAt: new Date() },
        ],
        summary: sampleSummary,
        duration: 2700, // 45 min
        createdAt: new Date('2024-12-27'),
        status: 'completed',
    },
    {
        id: 'm3',
        title: 'Alinhamento com Marketing',
        participants: [mockPeople[1], mockPeople[3]],
        tags: [mockTags[2]],
        transcript: [
            { id: 'ts6', speakerId: 'p2', speakerName: 'Maria Santos', text: 'Precisamos alinhar a campanha de lançamento.', timestamp: 0, createdAt: new Date() },
        ],
        summary: {
            topics: ['Campanha de lançamento', 'Materiais de marketing', 'Timeline de divulgação'],
            decisions: ['Iniciar campanha em Janeiro', 'Focar em redes sociais'],
            nextSteps: ['Maria: Criar briefing', 'Ana: Revisar orçamento'],
            risks: ['Prazo apertado para produção de materiais'],
        },
        duration: 1800, // 30 min
        createdAt: new Date('2024-12-28'),
        status: 'completed',
    },
    {
        id: 'm4',
        title: 'Review de Performance Q4',
        participants: [mockPeople[3], mockPeople[4]],
        tags: [mockTags[3], mockTags[4]],
        transcript: [],
        summary: null,
        duration: 5400, // 1.5 hours
        createdAt: new Date('2024-12-30'),
        status: 'completed',
    },
];

// Helper to initialize store with mock data
export function initializeMockData() {
    return {
        meetings: mockMeetings,
        people: mockPeople,
        tags: mockTags,
    };
}
