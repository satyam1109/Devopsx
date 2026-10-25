import { describe, it, expect } from "vitest";
import { completion, lessonsFor, filterLessons, dueCards } from "./content";
import type { Content } from "./types";
const make = (
  id: string,
  kind: Content["kind"],
  parentId: string | null = null,
  extra: Partial<Content> = {},
): Content => ({
  id,
  kind,
  parentId,
  trackIds: [],
  title: id,
  summary: "",
  status: "PUBLISHED",
  position: 0,
  minutes: 5,
  tags: [],
  blocks: [],
  cardType: null,
  question: null,
  answer: null,
  options: [],
  correctOption: null,
  correctOrder: [],
  ...extra,
});
const catalog = [
  make("ai", "TRACK"),
  make("fde", "TRACK"),
  make("shared", "CONCEPT", null, { trackIds: ["ai", "fde"] }),
  make("topic", "TOPIC", "shared"),
  make("late", "LESSON", "topic", { position: 2, title: "Chunk size" }),
  make("early", "LESSON", "topic", {
    position: 1,
    title: "Splitting documents",
    tags: ["RAG"],
  }),
  make("card", "FLASHCARD", "early"),
];
describe("shared learning content", () => {
  it("uses the same ordered lesson IDs in both tracks", () => {
    expect(lessonsFor(catalog, "ai").map((x) => x.id)).toEqual([
      "early",
      "late",
    ]);
    expect(lessonsFor(catalog, "fde")).toEqual(lessonsFor(catalog, "ai"));
  });
  it("calculates progress only from lessons within the selected scope", () => {
    expect(completion(lessonsFor(catalog, "ai"), ["early", "unrelated"])).toBe(
      50,
    );
    expect(completion([], ["early"])).toBe(0);
  });
  it("combines search, concept and saved filters without cloning lessons", () => {
    expect(filterLessons(catalog, "rag", "shared", true, ["early"])).toEqual([
      catalog.find((x) => x.id === "early"),
    ]);
    expect(filterLessons(catalog, "chunk", "shared", true, ["early"])).toEqual(
      [],
    );
  });
  it("removes scheduled cards from the due queue", () => {
    expect(
      dueCards(catalog, {
        completed: [],
        reviews: [
          {
            cardId: "card",
            rating: 3,
            repetitions: 1,
            dueAt: "2099-01-01T00:00:00Z",
          },
        ],
      }),
    ).toEqual([]);
    expect(dueCards(catalog, { completed: [], reviews: [] })).toHaveLength(1);
  });
  it("finds lessons by their parent topic or main concept", () => {
    expect(
      filterLessons(catalog, "topic", "", false, []).map((x) => x.id),
    ).toEqual(["late", "early"]);
    expect(filterLessons(catalog, " shared ", "", false, [])).toHaveLength(2);
  });
});
