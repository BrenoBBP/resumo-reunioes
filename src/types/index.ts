// ============================================
// CORE TYPES - Meeting Management App
// ============================================

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface TopicTag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number; // seconds from start
  createdAt: Date;
}

export interface MeetingSummary {
  topics: string[];
  decisions: string[];
  nextSteps: string[];
  risks: string[];
}

export interface Meeting {
  id: string;
  title: string;
  participants: Person[];
  tags: TopicTag[];
  transcript: TranscriptSegment[];
  summary: MeetingSummary | null;
  duration: number; // seconds
  createdAt: Date;
  status: 'recording' | 'paused' | 'completed';
  tempLinkCode?: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface ModalState {
  isOpen: boolean;
  type: 'speaker' | 'newPerson' | 'tempLink' | 'confirm' | null;
  data?: unknown;
}

export interface FilterState {
  searchQuery: string;
  personId: string | null;
  tagId: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: 'date' | 'title' | 'duration';
  sortOrder: 'asc' | 'desc';
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export interface ChipProps {
  label: string;
  color?: string;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'search' | 'email' | 'password';
  className?: string;
  icon?: React.ReactNode;
  error?: string;
}

// ============================================
// NAVIGATION TYPES
// ============================================

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

// ============================================
// API/STUB TYPES (for future integration)
// ============================================

export interface AudioCaptureOptions {
  deviceId?: string;
  sampleRate?: number;
  channels?: number;
}

export interface TranscriptionConfig {
  language?: string;
  enablePunctuation?: boolean;
  enableSpeakerDiarization?: boolean;
  speakerName?: string;
}

export interface SummarizationOptions {
  maxTopics?: number;
  includeActionItems?: boolean;
  language?: string;
}
