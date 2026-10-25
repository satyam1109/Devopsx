import type { Content } from "../lib/types";
import { cardFormats, cardFormatLabel } from "../lib/personalFlashcards";
import { Field } from "./ui";
export function FlashcardFields({
  draft,
  update,
  embedded = false,
}: {
  embedded?: boolean;
  draft: Content;
  update: (v: Partial<Content>) => void;
}) {
  return (
    <section className={embedded ? "flashcard-fields" : "panel editor-section"}>
      <h2>Flashcard content</h2>
      <Field label="Card format">
        <select
          aria-label="Card format"
          value={draft.cardType || "concept"}
          onChange={(e) =>
            update({ cardType: e.target.value as Content["cardType"] })
          }
        >
          {cardFormats.map((x) => (
            <option key={x} value={x}>
              {cardFormatLabel(x)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Question or prompt">
        <textarea
          aria-label="Question"
          required
          rows={3}
          value={draft.question || ""}
          onChange={(e) => update({ question: e.target.value })}
        />
      </Field>
      <Field label="Answer and explanation">
        <textarea
          aria-label="Answer and explanation"
          required
          rows={4}
          value={draft.answer || ""}
          onChange={(e) => update({ answer: e.target.value })}
        />
      </Field>
      {["choice", "ordering"].includes(draft.cardType || "") && (
        <>
          <Field label="Options (one per line)">
            <textarea
              aria-label="Answer options"
              required
              rows={4}
              value={draft.options.join("\n")}
              onChange={(e) => update({ options: e.target.value.split("\n") })}
            />
          </Field>
          {draft.cardType === "choice" ? (
            <Field label="Correct answer">
              <select
                aria-label="Correct answer"
                value={draft.correctOption ?? 0}
                onChange={(e) =>
                  update({ correctOption: Number(e.target.value) })
                }
              >
                {draft.options.map((x, i) => (
                  <option key={i} value={i}>
                    {x || "Option " + (i + 1)}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Correct sequence (one option per line)">
              <textarea
                aria-label="Correct sequence"
                required
                rows={4}
                value={draft.correctOrder.join("\n")}
                onChange={(e) =>
                  update({ correctOrder: e.target.value.split("\n") })
                }
              />
            </Field>
          )}
        </>
      )}
    </section>
  );
}
