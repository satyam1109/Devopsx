import type { Content, Progress, Review } from "./types";

export const PERSONAL_CARDS_KEY = "devopsx:personal-flashcards:v1";
export const cardFormats = [
  "concept",
  "scenario",
  "flaw",
  "choice",
  "ordering",
] as const;
export const cardFormatLabel = (format: string | null) =>
  ({
    concept: "Concept",
    scenario: "Scenario",
    flaw: "Spot the flaw",
    choice: "Multiple choice",
    ordering: "Ordering",
  })[format || ""] || "Concept";
export type PersonalFlashcard = { sourceId: string | null; content: Content };
export type PersonalFlashcards = {
  cards: PersonalFlashcard[];
  reviews: Review[];
};
export const emptyPersonalFlashcards = (): PersonalFlashcards => ({
  cards: [],
  reviews: [],
});

export function blankFlashcard(lessonId = ""): Content {
  return {
    id: "",
    kind: "FLASHCARD",
    parentId: lessonId,
    trackIds: [],
    title: "",
    summary: "",
    status: "PUBLISHED",
    position: 0,
    minutes: 0,
    tags: [],
    blocks: [],
    cardType: "concept",
    question: "",
    answer: "",
    options: [],
    correctOption: 0,
    correctOrder: [],
  };
}

export function normalizeFlashcard(card: Content): Content {
  if (!cardFormats.some((format) => format === card.cardType))
    throw new Error("Choose a card format.");
  const question = card.question?.trim(),
    answer = card.answer?.trim();
  if (!question || question.length > 4000)
    throw new Error("Add a question of up to 4,000 characters.");
  if (!answer || answer.length > 12000)
    throw new Error(
      "Add an answer and explanation of up to 12,000 characters.",
    );
  if (
    typeof card.parentId !== "string" ||
    !card.parentId ||
    card.parentId.length > 80
  )
    throw new Error("Choose a lesson for this flashcard.");
  const hasOptions = card.cardType === "choice" || card.cardType === "ordering";
  const options =
    hasOptions && Array.isArray(card.options)
      ? card.options.map((x) => (typeof x === "string" ? x.trim() : ""))
      : [];
  if (
    hasOptions &&
    (options.length < 2 ||
      options.length > 20 ||
      options.some((x) => !x || x.length > 2000) ||
      new Set(options).size !== options.length)
  )
    throw new Error(
      "Add 2–20 distinct, non-empty options, one per line (up to 2,000 characters each).",
    );
  if (
    card.cardType === "choice" &&
    (!Number.isInteger(card.correctOption) ||
      card.correctOption === null ||
      card.correctOption < 0 ||
      card.correctOption >= options.length)
  )
    throw new Error("Select the correct answer.");
  const correctOrder =
    card.cardType === "ordering" && Array.isArray(card.correctOrder)
      ? card.correctOrder.map((x) => (typeof x === "string" ? x.trim() : ""))
      : [];
  if (
    card.cardType === "ordering" &&
    (correctOrder.length !== options.length ||
      new Set(correctOrder).size !== options.length ||
      correctOrder.some((x) => !options.includes(x)))
  )
    throw new Error(
      "The correct sequence must contain each option exactly once.",
    );
  return {
    ...blankFlashcard(card.parentId),
    id: card.id,
    title: question.slice(0, 160),
    question,
    answer,
    cardType: card.cardType,
    options,
    correctOption: card.cardType === "choice" ? card.correctOption : null,
    correctOrder,
  };
}

export function readPersonalFlashcards(): PersonalFlashcards {
  try {
    const raw = localStorage.getItem(PERSONAL_CARDS_KEY);
    if (!raw) return emptyPersonalFlashcards();
    const data = JSON.parse(raw);
    if (
      data.version !== 1 ||
      !Array.isArray(data.cards) ||
      data.cards.length > 1000 ||
      !Array.isArray(data.reviews) ||
      data.reviews.length > 1000
    )
      return emptyPersonalFlashcards();
    const cards: PersonalFlashcard[] = data.cards.map(
      (entry: PersonalFlashcard) => {
        if (
          !entry ||
          !entry.content ||
          typeof entry.content.id !== "string" ||
          !entry.content.id ||
          entry.content.id.length > 80 ||
          (entry.sourceId !== null && entry.sourceId !== entry.content.id) ||
          (entry.sourceId === null && !entry.content.id.startsWith("personal-"))
        )
          throw new Error("Invalid personal card");
        return {
          sourceId: entry.sourceId,
          content: normalizeFlashcard(entry.content),
        };
      },
    );
    if (new Set(cards.map((x) => x.content.id)).size !== cards.length)
      return emptyPersonalFlashcards();
    const ids = new Set(cards.map((x) => x.content.id));
    const reviews: Review[] = data.reviews.filter(
      (r: Review) =>
        r &&
        ids.has(r.cardId) &&
        Number.isInteger(r.rating) &&
        r.rating >= 1 &&
        r.rating <= 4 &&
        Number.isSafeInteger(r.repetitions) &&
        r.repetitions > 0 &&
        typeof r.dueAt === "string" &&
        Number.isFinite(Date.parse(r.dueAt)),
    );
    return { cards, reviews };
  } catch {
    return emptyPersonalFlashcards();
  }
}

export function writePersonalFlashcards(state: PersonalFlashcards) {
  if (state.cards.length > 1000)
    throw new Error(
      "This demo supports up to 1,000 personal flashcards in a browser.",
    );
  try {
    localStorage.setItem(
      PERSONAL_CARDS_KEY,
      JSON.stringify({ version: 1, ...state }),
    );
  } catch {
    throw new Error(
      "Your browser could not save this flashcard. Allow site storage or free up space and try again.",
    );
  }
}

export function personalCatalog(
  shared: Content[],
  personal: PersonalFlashcards,
): Content[] {
  const lessons = new Set(
    shared.filter((x) => x.kind === "LESSON").map((x) => x.id),
  );
  const originals = new Set(
    shared.filter((x) => x.kind === "FLASHCARD").map((x) => x.id),
  );
  const visible = personal.cards.filter(
    (x) =>
      lessons.has(x.content.parentId || "") &&
      (!x.sourceId || originals.has(x.sourceId)),
  );
  const overrides = new Map(
    visible.filter((x) => x.sourceId).map((x) => [x.sourceId, x.content]),
  );
  return [
    ...shared.map((x) => overrides.get(x.id) || x),
    ...visible.filter((x) => !x.sourceId).map((x) => x.content),
  ];
}

export function personalProgress(
  base: Progress,
  personal: PersonalFlashcards,
  catalog: Content[],
): Progress {
  const visible = new Set(
    catalog.filter((x) => x.kind === "FLASHCARD").map((x) => x.id),
  );
  const reviews = personal.reviews.filter((x) => visible.has(x.cardId));
  const ids = new Set(reviews.map((x) => x.cardId));
  return {
    ...base,
    reviews: [...base.reviews.filter((x) => !ids.has(x.cardId)), ...reviews],
  };
}

export function preparePersonalFlashcard(
  draft: Content,
  shared: Content[],
  personal: PersonalFlashcards,
): PersonalFlashcard {
  if (!shared.some((x) => x.kind === "LESSON" && x.id === draft.parentId))
    throw new Error("Choose an available lesson for this flashcard.");
  const original = shared.find(
    (x) => x.kind === "FLASHCARD" && x.id === draft.id,
  );
  const existing = personal.cards.find((x) => x.content.id === draft.id);
  if (draft.id && !original && !existing)
    throw new Error("This flashcard is no longer available.");
  return {
    sourceId: existing ? existing.sourceId : original?.id || null,
    content: normalizeFlashcard({
      ...draft,
      id: draft.id || "personal-" + crypto.randomUUID(),
    }),
  };
}
