import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock3,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ancestors, lessonsFor } from "../lib/content";
import { Badge, Button, ErrorNotice } from "../components/ui";
import { LessonBody } from "../components/LessonBody";
import { NotFound } from "./LearningPages";
import { message } from "../lib/api";
export function LessonPage() {
  const { id } = useParams();
  const { catalog, preferences, progress, complete, save } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setError("");
    window.scrollTo(0, 0);
  }, [id]);
  const lesson = catalog.find((x) => x.id === id && x.kind === "LESSON");
  if (!lesson) return <NotFound />;
  const path = ancestors(catalog, lesson.id);
  const concept = path.find((x) => x.kind === "CONCEPT");
  const sequence = concept ? lessonsFor(catalog, concept.id) : [lesson];
  const index = sequence.findIndex((x) => x.id === lesson.id);
  const next = sequence[index + 1],
    prev = sequence[index - 1];
  const done = progress.completed.includes(lesson.id),
    saved = preferences.saved.includes(lesson.id);
  const cards = catalog.filter(
    (x) => x.kind === "FLASHCARD" && x.parentId === lesson.id,
  );
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <article className="lesson-reader">
      <div className="lesson-toolbar">
        <Link to={"/topics/" + lesson.parentId} className="back-link">
          <ArrowLeft size={16} />
          Back to topic
        </Link>
        <Button
          variant="ghost"
          aria-pressed={saved}
          busy={busy}
          onClick={() => void act(() => save(lesson.id))}
        >
          <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save lesson"}
        </Button>
      </div>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/journey">Learning journey</Link>
        {path.map((p) => (
          <span key={p.id}>
            <ChevronRight size={13} />
            {p.kind === "LESSON" ? (
              <span aria-current="page">{p.title}</span>
            ) : (
              <Link
                to={(p.kind === "CONCEPT" ? "/journey/" : "/topics/") + p.id}
              >
                {p.title}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <header className="lesson-header">
        <div className="lesson-meta">
          <Badge>LESSON {String(index + 1).padStart(2, "0")}</Badge>
          <span>
            <Clock3 size={15} />
            {lesson.minutes} min read
          </span>
          {done && (
            <Badge tone="green">
              <Check size={13} />
              Completed
            </Badge>
          )}
        </div>
        <h1>{lesson.title}</h1>
        <p>{lesson.summary}</p>
      </header>
      <ErrorNotice error={error} />
      <LessonBody blocks={lesson.blocks} />
      <section className="lesson-finish">
        <div>
          <Badge tone="green">ONE IDEA CLOSER</Badge>
          <h2>
            {done
              ? "You’ve completed this lesson."
              : "Ready to make it part of your toolkit?"}
          </h2>
          <p>
            {done
              ? "You can revisit this material any time. Your progress is saved."
              : "Mark this lesson complete to update your learning journey."}
          </p>
        </div>
        <Button
          busy={busy}
          variant={done ? "secondary" : "primary"}
          onClick={() => void act(() => complete(lesson.id, !done))}
        >
          <Check size={17} />
          {done ? "Mark as incomplete" : "Mark as complete"}
        </Button>
      </section>
      {cards.length > 0 && (
        <Link
          className="lesson-practice"
          to={"/flashcards?lesson=" + lesson.id}
        >
          <Layers size={24} />
          <span>
            <strong>Make the idea stick</strong>
            <small>Practice {cards.length} flashcards from this lesson</small>
          </span>
          <ArrowRight size={19} />
        </Link>
      )}
      <nav className="lesson-pagination" aria-label="Lesson navigation">
        {prev ? (
          <Link to={"/lessons/" + prev.id}>
            <ArrowLeft size={17} />
            <span>
              <small>PREVIOUS LESSON</small>
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={"/lessons/" + next.id}>
            <span>
              <small>NEXT LESSON</small>
              {next.title}
            </span>
            <ArrowRight size={17} />
          </Link>
        ) : (
          <Link to="/journey">
            <span>
              <small>KEEP EXPLORING</small>Back to learning journey
            </span>
            <ArrowRight size={17} />
          </Link>
        )}
      </nav>
    </article>
  );
}
