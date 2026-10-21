export type Kind = "TRACK" | "CONCEPT" | "TOPIC" | "LESSON" | "FLASHCARD";
export type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export interface Block {
  id: string;
  type:
    "paragraph" | "heading" | "callout" | "bullets" | "code" | "image" | "link";
  title?: string;
  text?: string;
  language?: string;
  url?: string;
  alt?: string;
}
export interface Content {
  id: string;
  kind: Kind;
  parentId: string | null;
  trackIds: string[];
  title: string;
  summary: string;
  status: Status;
  position: number;
  minutes: number;
  tags: string[];
  blocks: Block[];
  cardType: "concept" | "scenario" | "flaw" | "choice" | "ordering" | null;
  question: string | null;
  answer: string | null;
  options: string[];
  correctOption: number | null;
  correctOrder: string[];
}
export interface Preferences {
  name: string;
  trackId: string;
  dailyGoal: number;
  saved: string[];
  onboarded: boolean;
}
export interface Review {
  cardId: string;
  rating: number;
  repetitions: number;
  dueAt: string;
}
export interface Progress {
  completed: string[];
  reviews: Review[];
}
export interface Session {
  role: "ANONYMOUS" | "LEARNER" | "ADMIN";
  csrfToken: string;
  demo: boolean;
}
export interface Media {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
}
