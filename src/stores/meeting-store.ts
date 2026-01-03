import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Meeting, Person, TopicTag, TranscriptSegment, MeetingSummary } from '@/types';

interface MeetingState {
    // Data
    meetings: Meeting[];
    people: Person[];
    tags: TopicTag[];

    // Current meeting state
    currentMeeting: Meeting | null;
    isRecording: boolean;
    isPaused: boolean;
    currentSpeaker: Person | null;

    // Actions - Meetings
    createMeeting: (title: string, participants: Person[]) => Meeting;
    updateMeeting: (id: string, updates: Partial<Meeting>) => void;
    deleteMeeting: (id: string) => void;
    getMeetingById: (id: string) => Meeting | undefined;

    // Actions - Recording
    startRecording: (meetingId: string) => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    stopRecording: () => void;

    // Actions - Transcript
    addTranscriptSegment: (segment: Omit<TranscriptSegment, 'id' | 'createdAt'>) => void;
    setSummary: (meetingId: string, summary: MeetingSummary) => void;

    // Actions - Speaker
    setCurrentSpeaker: (person: Person | null) => void;
    switchSpeaker: (person: Person) => void;

    // Actions - People
    addPerson: (name: string) => Person;
    updatePerson: (id: string, updates: Partial<Person>) => void;
    deletePerson: (id: string) => void;

    // Actions - Tags
    addTag: (name: string, color?: string) => TopicTag;
    updateTag: (id: string, updates: Partial<TopicTag>) => void;
    deleteTag: (id: string) => void;

    // Actions - Meeting Tags/Participants
    addParticipantToMeeting: (meetingId: string, person: Person) => void;
    removeParticipantFromMeeting: (meetingId: string, personId: string) => void;
    addTagToMeeting: (meetingId: string, tag: TopicTag) => void;
    removeTagFromMeeting: (meetingId: string, tagId: string) => void;

    // Filters
    getMeetingsByPerson: (personId: string) => Meeting[];
    getMeetingsByTag: (tagId: string) => Meeting[];
    searchMeetings: (query: string) => Meeting[];
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useMeetingStore = create<MeetingState>()(
    persist(
        (set, get) => ({
            meetings: [],
            people: [],
            tags: [],
            currentMeeting: null,
            isRecording: false,
            isPaused: false,
            currentSpeaker: null,

            // Meeting CRUD
            createMeeting: (title, participants) => {
                const meeting: Meeting = {
                    id: generateId(),
                    title,
                    participants,
                    tags: [],
                    transcript: [],
                    summary: null,
                    duration: 0,
                    createdAt: new Date(),
                    status: 'recording',
                };
                set((state) => ({
                    meetings: [...state.meetings, meeting],
                    currentMeeting: meeting,
                    isRecording: true,
                }));
                return meeting;
            },

            updateMeeting: (id, updates) => {
                set((state) => ({
                    meetings: state.meetings.map((m) =>
                        m.id === id ? { ...m, ...updates } : m
                    ),
                    currentMeeting: state.currentMeeting?.id === id
                        ? { ...state.currentMeeting, ...updates }
                        : state.currentMeeting,
                }));
            },

            deleteMeeting: (id) => {
                set((state) => ({
                    meetings: state.meetings.filter((m) => m.id !== id),
                    currentMeeting: state.currentMeeting?.id === id ? null : state.currentMeeting,
                }));
            },

            getMeetingById: (id) => get().meetings.find((m) => m.id === id),

            // Recording
            startRecording: (meetingId) => {
                const meeting = get().getMeetingById(meetingId);
                if (meeting) {
                    set({ currentMeeting: meeting, isRecording: true, isPaused: false });
                }
            },

            pauseRecording: () => set({ isPaused: true }),
            resumeRecording: () => set({ isPaused: false }),

            stopRecording: () => {
                const { currentMeeting } = get();
                if (currentMeeting) {
                    get().updateMeeting(currentMeeting.id, { status: 'completed' });
                }
                set({ isRecording: false, isPaused: false, currentSpeaker: null });
            },

            // Transcript
            addTranscriptSegment: (segment) => {
                const { currentMeeting } = get();
                if (!currentMeeting) return;

                const newSegment: TranscriptSegment = {
                    ...segment,
                    id: generateId(),
                    createdAt: new Date(),
                };

                get().updateMeeting(currentMeeting.id, {
                    transcript: [...currentMeeting.transcript, newSegment],
                });
            },

            setSummary: (meetingId, summary) => {
                get().updateMeeting(meetingId, { summary });
            },

            // Speaker
            setCurrentSpeaker: (person) => set({ currentSpeaker: person }),

            switchSpeaker: (person) => {
                set({ currentSpeaker: person });
                // Add person as participant if not already
                const { currentMeeting } = get();
                if (currentMeeting && !currentMeeting.participants.some(p => p.id === person.id)) {
                    get().addParticipantToMeeting(currentMeeting.id, person);
                }
            },

            // People CRUD
            addPerson: (name) => {
                const person: Person = {
                    id: generateId(),
                    name,
                    createdAt: new Date(),
                };
                set((state) => ({ people: [...state.people, person] }));
                return person;
            },

            updatePerson: (id, updates) => {
                set((state) => ({
                    people: state.people.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                }));
            },

            deletePerson: (id) => {
                set((state) => ({ people: state.people.filter((p) => p.id !== id) }));
            },

            // Tags CRUD
            addTag: (name, color) => {
                const tag: TopicTag = {
                    id: generateId(),
                    name,
                    color: color || 'indigo',
                    createdAt: new Date(),
                };
                set((state) => ({ tags: [...state.tags, tag] }));
                return tag;
            },

            updateTag: (id, updates) => {
                set((state) => ({
                    tags: state.tags.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                }));
            },

            deleteTag: (id) => {
                set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
            },

            // Meeting participants & tags
            addParticipantToMeeting: (meetingId, person) => {
                const meeting = get().getMeetingById(meetingId);
                if (meeting && !meeting.participants.some(p => p.id === person.id)) {
                    get().updateMeeting(meetingId, {
                        participants: [...meeting.participants, person],
                    });
                }
            },

            removeParticipantFromMeeting: (meetingId, personId) => {
                const meeting = get().getMeetingById(meetingId);
                if (meeting) {
                    get().updateMeeting(meetingId, {
                        participants: meeting.participants.filter(p => p.id !== personId),
                    });
                }
            },

            addTagToMeeting: (meetingId, tag) => {
                const meeting = get().getMeetingById(meetingId);
                if (meeting && !meeting.tags.some(t => t.id === tag.id)) {
                    get().updateMeeting(meetingId, {
                        tags: [...meeting.tags, tag],
                    });
                }
            },

            removeTagFromMeeting: (meetingId, tagId) => {
                const meeting = get().getMeetingById(meetingId);
                if (meeting) {
                    get().updateMeeting(meetingId, {
                        tags: meeting.tags.filter(t => t.id !== tagId),
                    });
                }
            },

            // Filters
            getMeetingsByPerson: (personId) => {
                return get().meetings.filter((m) =>
                    m.participants.some((p) => p.id === personId)
                );
            },

            getMeetingsByTag: (tagId) => {
                return get().meetings.filter((m) =>
                    m.tags.some((t) => t.id === tagId)
                );
            },

            searchMeetings: (query) => {
                const lowerQuery = query.toLowerCase();
                return get().meetings.filter(
                    (m) =>
                        m.title.toLowerCase().includes(lowerQuery) ||
                        m.participants.some((p) => p.name.toLowerCase().includes(lowerQuery)) ||
                        m.tags.some((t) => t.name.toLowerCase().includes(lowerQuery))
                );
            },
        }),
        {
            name: 'meeting-storage',
            partialize: (state) => ({
                meetings: state.meetings,
                people: state.people,
                tags: state.tags,
            }),
        }
    )
);
