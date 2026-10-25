import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Layers,
  RotateCcw,
  Lightbulb,
  Plus,
  Pencil,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { dueCards } from "../lib/content";
import {
  PageHeader,
  Button,
  Badge,
  EmptyState,
  ProgressBar,
  ErrorNotice,
  ActionLink,
} from "../components/ui";
import { message } from "../lib/api";
import type { Content } from "../lib/types";
import { cardFormatLabel } from "../lib/personalFlashcards";
import { FlashcardEditor } from "../components/FlashcardEditor";
export function Flashcards() {
  const { catalog, saveFlashcard } = useApp();
  const [params] = useSearchParams();
  const [editor, setEditor] = useState<Content | null | undefined>(undefined);
  const [notice, setNotice] = useState("");
  return (
    <>
      {notice && (
        <p className="flashcard-notice" role="status">
          <Check size={17} />
          {notice}
        </p>
      )}
      <FlashcardsContent
        onCreate={() => {
          setNotice("");
          setEditor(null);
        }}
        onEdit={(card) => {
          setNotice("");
          setEditor(card);
        }}
        onStart={() => setNotice("")}
        editorOpen={editor !== undefined}
      />
      {editor !== undefined && (
        <FlashcardEditor
          card={editor}
          lessonId={params.get("lesson") || undefined}
          lessons={catalog.filter((x) => x.kind === "LESSON")}
          onClose={() => setEditor(undefined)}
          onSave={async (draft) => {
            await saveFlashcard(draft);
            setEditor(undefined);
            setNotice(
              editor
                ? "Your personal changes are saved in this browser."
                : "Flashcard created. It is ready to review.",
            );
          }}
        />
      )}
    </>
  );
}

function FlashcardsContent({
  onCreate,
  onEdit,
  onStart,
  editorOpen,
}: {
  onCreate: () => void;
  onEdit: (card: Content) => void;
  onStart: () => void;
  editorOpen: boolean;
}) {
  const { catalog, progress, review, personalCards } = useApp();
  const [params] = useSearchParams();
  const lesson = params.get("lesson");
  const all = catalog.filter(
    (x) => x.kind === "FLASHCARD" && (!lesson || x.parentId === lesson),
  );
  const due = dueCards(all, progress);
  const [queue, setQueue] = useState<string[] | null>(null),
    [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false),
    [choice, setChoice] = useState<number | null>(null),
    [order, setOrder] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [score, setScore] = useState<boolean | null>(null);
  const revealRef = useRef<HTMLButtonElement>(null);
  const card = queue ? catalog.find((x) => x.id === queue[index]) : null;
  const finished = queue !== null && index >= queue.length;
  useEffect(() => {
    setRevealed(false);
    setChoice(null);
    setScore(null);
    setOrder(card?.options ? [...card.options] : []);
    setError("");
  }, [card]);
  const start = (allCards = false) => {
    onStart();
    setQueue((allCards ? all : due).map((x) => x.id));
    setIndex(0);
  };
  const reveal = () => {
    if (!card) return;
    if (card.cardType === "choice") {
      if (choice === null) return;
      setScore(choice === card.correctOption);
    }
    if (card.cardType === "ordering")
      setScore(order.every((x, i) => x === card.correctOrder[i]));
    setRevealed(true);
  };
  const rate = async (rating: number) => {
    if (!card || busy) return;
    setBusy(true);
    setError("");
    try {
      await review(card.id, rating);
      setIndex((i) => i + 1);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        !card ||
        editorOpen ||
        busy ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        void rate(Number(e.key));
      } else if (
        e.code === "Space" &&
        !revealed &&
        card.cardType !== "choice" &&
        card.cardType !== "ordering" &&
        e.target === document.body
      ) {
        e.preventDefault();
        revealRef.current?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  if (!queue)
    return (
      <>
        <PageHeader
          eyebrow="FLASHCARDS"
          title="A little recall. A lasting idea."
          description="Practice what you’ve learned, one small question at a time."
          action={
            <Button onClick={onCreate}>
              <Plus size={17} />
              Create Flashcard
            </Button>
          }
        />
        <section className="panel flashcard-intro">
          <div className="flashcard-illustration">
            <span />
            <div>
              <Layers size={49} />
            </div>
            <span />
          </div>
          <Badge>QUICK PRACTICE</Badge>
          <h2>Make room for what sticks.</h2>
          <p>
            Concepts, scenarios, and practical decisions.
            <br />
            Give your memory a small workout.
          </p>
          <div className="review-counts">
            <div>
              <strong>{due.length}</strong>
              <span>Ready to review</span>
            </div>
            <div>
              <strong>{all.length}</strong>
              <span>Cards in this collection</span>
            </div>
          </div>
          <div className="center-actions">
            <Button disabled={!due.length} onClick={() => start()}>
              Start review <ArrowRight size={17} />
            </Button>
            {all.length > 0 && (
              <Button variant="secondary" onClick={() => start(true)}>
                Practice all cards
              </Button>
            )}
          </div>
          {!all.length && (
            <p>
              Create your first flashcard, or explore published cards from other
              lessons.
            </p>
          )}
          <small>
            Use Space to reveal and 1–4 to rate. Your next review adjusts to
            your rating.
          </small>
        </section>
        <div className="quiet-note">
          <Lightbulb size={18} />
          Demo cards illustrate the review formats. Your team will author the
          learning content later.
        </div>
        <section
          className="panel flashcard-collection"
          aria-label="Flashcard collection"
        >
          <div className="section-heading">
            <div>
              <h2>Your collection</h2>
              <p className="muted small">
                Edit a card to make it work for you. Personal cards and edits
                stay in this browser.
              </p>
            </div>
            <Badge tone="neutral">{all.length} cards</Badge>
          </div>
          {all.map((item) => {
            const personal = personalCards.find(
              (x) => x.content.id === item.id,
            );
            return (
              <article className="flashcard-collection-row" key={item.id}>
                <div>
                  <div className="flashcard-row-meta">
                    <Badge tone="neutral">
                      {cardFormatLabel(item.cardType)}
                    </Badge>
                    {personal && (
                      <Badge>
                        {personal.sourceId ? "Your edit" : "Personal"}
                      </Badge>
                    )}
                  </div>
                  <h3>{item.question}</h3>
                  <Link to={"/lessons/" + item.parentId}>
                    {catalog.find((x) => x.id === item.parentId)?.title}
                  </Link>
                </div>
                <Button
                  variant="secondary"
                  aria-label={"Edit flashcard: " + item.question}
                  onClick={() => onEdit(item)}
                >
                  <Pencil size={15} />
                  Edit
                </Button>
              </article>
            );
          })}
          {!all.length && (
            <p className="muted">No flashcards in this collection yet.</p>
          )}
        </section>
      </>
    );
  if (finished)
    return (
      <EmptyState
        title="A little stronger than before."
        description={`You reviewed ${queue.length} cards. Your ratings have been saved for the next session.`}
        action={
          <>
            <Button onClick={() => setQueue(null)}>
              <RotateCcw size={16} />
              Back to flashcards
            </Button>
            <ActionLink to="/journey" secondary>
              Continue learning
            </ActionLink>
            <Button variant="secondary" onClick={onCreate}>
              <Plus size={17} />
              Create Flashcard
            </Button>
          </>
        }
      />
    );
  if (!card)
    return (
      <EmptyState
        title="This card is no longer available"
        description="The content may have changed while you were studying."
        action={
          <Button onClick={() => setQueue(null)}>Back to flashcards</Button>
        }
      />
    );
  const move = (from: number, to: number) => {
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
  };
  return (
    <>
      <PageHeader
        eyebrow="FLASHCARD REVIEW"
        title="One idea at a time."
        action={
          <div className="flashcard-actions">
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setQueue(null)}
            >
              End session
            </Button>
            <Button disabled={busy} onClick={onCreate}>
              <Plus size={17} />
              Create Flashcard
            </Button>
          </div>
        }
      />
      <div className="review-progress">
        <span>
          Card {index + 1} of {queue.length}
        </span>
        <ProgressBar
          value={Math.round((index / queue.length) * 100)}
          label="Review session"
        />
      </div>
      <section className="panel study-card">
        <div className="study-card-header">
          <Badge>
            {card.cardType === "flaw"
              ? "SPOT THE FLAW"
              : card.cardType?.toUpperCase()}
          </Badge>
          <div className="flashcard-actions">
            {personalCards.some((x) => x.content.id === card.id) && (
              <Badge>Personal</Badge>
            )}
            <Link to={"/lessons/" + card.parentId}>
              View lesson <ArrowRight size={14} />
            </Link>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => onEdit(card)}
            >
              <Pencil size={15} />
              Edit
            </Button>
          </div>
        </div>
        <h2>{card.question}</h2>
        {card.cardType === "choice" && (
          <div
            className="choice-options"
            role="radiogroup"
            aria-label="Answer choices"
          >
            {card.options.map((x, i) => (
              <button
                disabled={revealed}
                role="radio"
                aria-label={`${String.fromCharCode(65 + i)} ${x}`}
                aria-checked={choice === i}
                className={`${choice === i ? "selected" : ""} ${revealed && card.correctOption === i ? "correct" : ""}`}
                key={x}
                onClick={() => setChoice(i)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {x}
                {revealed && card.correctOption === i && <Check size={18} />}
              </button>
            ))}
          </div>
        )}
        {card.cardType === "ordering" && (
          <ol className="ordering-options">
            {order.map((x, i) => (
              <li key={x}>
                <span className="order-index">{i + 1}</span>
                <strong>{x}</strong>
                <Button
                  variant="ghost"
                  aria-label={`Move ${x} up`}
                  disabled={revealed || i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  variant="ghost"
                  aria-label={`Move ${x} down`}
                  disabled={revealed || i === order.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown size={16} />
                </Button>
              </li>
            ))}
          </ol>
        )}
        {!revealed ? (
          <div className="reveal-action">
            <Button
              disabled={card.cardType === "choice" && choice === null}
              onClick={reveal}
            >
              {["choice", "ordering"].includes(card.cardType || "")
                ? "Check answer"
                : "Reveal answer"}
            </Button>
            <button
              ref={revealRef}
              onClick={reveal}
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />
            <small>
              {["choice", "ordering"].includes(card.cardType || "")
                ? "Take your time. Think it through."
                : "Try recalling the idea before revealing the answer."}
            </small>
          </div>
        ) : (
          <div className="card-answer" aria-live="polite">
            {score !== null && (
              <Badge tone={score ? "green" : "amber"}>
                {score ? "That’s right" : "A chance to learn"}
              </Badge>
            )}
            <h3>{score === null ? "The idea to remember" : "Explanation"}</h3>
            <p>{card.answer}</p>
            {card.cardType === "ordering" && (
              <ol>
                {card.correctOrder.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>
      <ErrorNotice error={error} />
      {revealed && (
        <section className="rating-panel">
          <h3>How well did you remember?</h3>
          <div className="rating-options">
            {[
              { n: 1, label: "Again", hint: "10 minutes" },
              { n: 2, label: "Hard", hint: "1 day" },
              { n: 3, label: "Good", hint: "A few days" },
              { n: 4, label: "Easy", hint: "Later this week" },
            ].map((x) => (
              <button
                disabled={busy}
                key={x.n}
                aria-label={`${x.n} ${x.label} ${x.hint}`}
                onClick={() => void rate(x.n)}
              >
                <kbd>{x.n}</kbd>
                <strong>{x.label}</strong>
                <small>{x.hint}</small>
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
