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
export function Flashcards() {
  const { catalog, progress, review } = useApp();
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
  }, [card?.id]);
  const start = (allCards = false) => {
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
            <p>Flashcards will appear here when an admin publishes them.</p>
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
          <Button variant="ghost" onClick={() => setQueue(null)}>
            End session
          </Button>
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
          <Link to={"/lessons/" + card.parentId}>
            View lesson <ArrowRight size={14} />
          </Link>
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
              <button disabled={busy} key={x.n} onClick={() => void rate(x.n)}>
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
