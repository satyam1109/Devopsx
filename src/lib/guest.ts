import type { Preferences, Progress } from "./types";

export const GUEST_STORAGE_KEY = "devopsx:guest:v1";
export type GuestState = { preferences: Preferences; progress: Progress };
export const newGuestState = (): GuestState => ({
  preferences: {
    name: "Alex",
    trackId: "track-ai",
    dailyGoal: 15,
    saved: [],
    onboarded: false,
  },
  progress: { completed: [], reviews: [] },
});
const ids = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 10000 &&
  value.every((id) => typeof id === "string" && id.length <= 80);

export function readGuest(): GuestState {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return newGuestState();
    const data = JSON.parse(raw);
    const p = data.preferences,
      r = data.progress;
    if (
      data.version !== 1 ||
      !p ||
      !r ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 60 ||
      typeof p.trackId !== "string" ||
      p.trackId.length > 80 ||
      ![10, 15, 30, 45].includes(p.dailyGoal) ||
      typeof p.onboarded !== "boolean" ||
      !ids(p.saved) ||
      !ids(r.completed) ||
      !Array.isArray(r.reviews) ||
      r.reviews.length > 10000 ||
      !r.reviews.every(
        (review: Record<string, unknown> | null) =>
          review &&
          typeof review.cardId === "string" &&
          review.cardId.length <= 80 &&
          Number.isInteger(review.rating) &&
          Number(review.rating) >= 1 &&
          Number(review.rating) <= 4 &&
          Number.isSafeInteger(review.repetitions) &&
          Number(review.repetitions) > 0 &&
          typeof review.dueAt === "string" &&
          Number.isFinite(Date.parse(review.dueAt)),
      )
    ) {
      return newGuestState();
    }
    return { preferences: p, progress: r };
  } catch {
    return newGuestState();
  }
}

export function writeGuest(state: GuestState): void {
  try {
    localStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({ version: 1, ...state }),
    );
  } catch {
    throw new Error(
      "Your browser could not save progress. Allow site storage and try again.",
    );
  }
}

export function reviewGuest(
  progress: Progress,
  cardId: string,
  rating: number,
): Progress {
  if (!Number.isInteger(rating) || rating < 1 || rating > 4)
    throw new Error("Choose a rating from 1 to 4.");
  const repetitions =
    (progress.reviews.find((r) => r.cardId === cardId)?.repetitions || 0) + 1;
  const days =
    rating === 1
      ? 0
      : rating === 2
        ? 1
        : rating === 3
          ? Math.min(30, 2 * repetitions)
          : Math.min(60, 4 * repetitions);
  return {
    ...progress,
    reviews: [
      ...progress.reviews.filter((r) => r.cardId !== cardId),
      {
        cardId,
        rating,
        repetitions,
        dueAt: new Date(
          Date.now() + (days ? days * 86400000 : 600000),
        ).toISOString(),
      },
    ],
  };
}
