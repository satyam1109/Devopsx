import { useEffect, useState, type FormEvent } from "react";
import type { Content } from "../lib/types";
import { blankFlashcard, normalizeFlashcard } from "../lib/personalFlashcards";
import { message } from "../lib/api";
import { FlashcardFields } from "./FlashcardFields";
import { Badge, Button, ErrorNotice, Field, Modal } from "./ui";

export function FlashcardEditor({
  card,
  lessonId,
  lessons,
  onSave,
  onClose,
}: {
  card: Content | null;
  lessonId?: string;
  lessons: Content[];
  onSave: (draft: Content) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() =>
    card ? structuredClone(card) : blankFlashcard(lessonId),
  );
  const [dirty, setDirty] = useState(false),
    [discarding, setDiscarding] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const update = (value: Partial<Content>) => {
    setDraft((current) => ({ ...current, ...value }));
    setDirty(true);
    setError("");
  };
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  const close = () => {
    if (!busy) {
      if (dirty) setDiscarding(true);
      else onClose();
    }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(normalizeFlashcard(draft));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={
        discarding
          ? "Discard your changes?"
          : card
            ? "Edit Flashcard"
            : "Create Flashcard"
      }
      onClose={close}
      wide={!discarding}
    >
      {discarding ? (
        <>
          <p>Your changes have not been saved.</p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setDiscarding(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={onClose}>
              Discard changes
            </Button>
          </div>
        </>
      ) : (
        <form className="personal-flashcard-form" onSubmit={submit}>
          <Badge tone="neutral">Personal flashcard · This browser</Badge>
          <p className="muted small">
            Saved in this browser for now. Your edits do not change the admin’s
            original card. Clearing site data removes personal cards and edits.
          </p>
          <Field label="Lesson">
            <select
              required
              value={draft.parentId || ""}
              onChange={(e) => update({ parentId: e.target.value })}
            >
              <option value="">Choose a lesson</option>
              {lessons.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </Field>
          <FlashcardFields draft={draft} update={update} embedded />
          <ErrorNotice error={error} />
          <div className="form-actions">
            <Button type="submit" busy={busy}>
              {card ? "Save changes" : "Create Flashcard"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
