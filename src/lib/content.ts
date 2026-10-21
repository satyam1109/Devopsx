import type { Content, Progress } from "./types";
export const sortContent = (items: Content[]) =>
  [...items].sort(
    (a, b) => a.position - b.position || a.title.localeCompare(b.title),
  );
export const children = (items: Content[], parentId: string, kind?: string) =>
  sortContent(
    items.filter((x) => x.parentId === parentId && (!kind || x.kind === kind)),
  );
export function lessonsFor(items: Content[], id: string): Content[] {
  const node = items.find((x) => x.id === id);
  if (!node) return [];
  if (node.kind === "LESSON") return [node];
  const descendants =
    node.kind === "TRACK"
      ? items.filter((x) => x.kind === "CONCEPT" && x.trackIds.includes(id))
      : children(items, id);
  return sortContent(descendants).flatMap((x) => lessonsFor(items, x.id));
}
export function completion(lessons: Content[], completed: string[]) {
  if (!lessons.length) return 0;
  return Math.round(
    (lessons.filter((x) => completed.includes(x.id)).length / lessons.length) *
      100,
  );
}
export function ancestors(items: Content[], id: string): Content[] {
  const item = items.find((x) => x.id === id);
  if (!item) return [];
  return item.parentId ? [...ancestors(items, item.parentId), item] : [item];
}
export function dueCards(items: Content[], progress: Progress) {
  return items.filter(
    (x) =>
      x.kind === "FLASHCARD" &&
      !progress.reviews.some(
        (r) => r.cardId === x.id && Date.parse(r.dueAt) > Date.now(),
      ),
  );
}
export function filterLessons(
  items: Content[],
  query: string,
  conceptId: string,
  savedOnly: boolean,
  saved: string[],
) {
  const eligible = conceptId
    ? new Set(lessonsFor(items, conceptId).map((x) => x.id))
    : null;
  return items.filter(
    (x) =>
      x.kind === "LESSON" &&
      (!eligible || eligible.has(x.id)) &&
      (!savedOnly || saved.includes(x.id)) &&
      `${x.title} ${x.summary} ${x.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
}

export const countLabel = (
  n: number,
  singular: string,
  plural = singular + "s",
) => `${n} ${n === 1 ? singular : plural}`;
