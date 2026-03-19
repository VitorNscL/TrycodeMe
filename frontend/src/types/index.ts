export type User = {
  id: number;
  email?: string;
  display_name: string;
  nickname: string;
  bio: string;
  avatar_url: string;
  role: 'user' | 'teacher' | 'admin';
  specialty: string;
  certifications: string[] | string;
  active_hours: number;
  lessons_completed: number;
  exercises_completed: number;
  wins: number;
  losses: number;
  rank: string;
};

export type LessonSection = {
  kind: 'text' | 'code' | 'image' | 'gif' | 'video' | 'command' | 'tip' | 'alert';
  title: string;
  content: string;
};

export type Lesson = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  learn_outcomes: string;
  language: string;
  category: string;
  difficulty: string;
  type: 'practical' | 'theory' | 'cyber' | 'quiz' | 'competitive';
  tags: string[];
  keywords: string[];
  featured: number;
  status: string;
  author_id: number;
  author_label: string;
  thumbnail_url?: string;
  sections?: LessonSection[];
  exercise_id?: number | null;
  author?: {
    id: number;
    name: string;
    avatarUrl: string;
    specialty: string;
    certifications: string[];
    role: string;
  };
};

export type Exercise = {
  id: number;
  title: string;
  summary: string;
  language: string;
  difficulty: string;
  type: 'code' | 'quiz' | 'cyber';
  prompt: string;
  starter_code: string;
  solution: string;
  test_config: any;
  featured: number;
  thumbnail_url?: string;
};

export type SiteSettings = {
  homeBackgroundUrl: string;
  communityRegisteredCount: string;
  communityHeadline: string;
  communitySubtitle: string;
  donationQrUrl: string;
  donationGoalsText: string;
};
