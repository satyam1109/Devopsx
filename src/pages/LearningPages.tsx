import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Clock3,
  BookOpen,
  Layers,
  Sparkles,
  Target,
  Search,
  Bookmark,
  ChevronRight,
  Route,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  lessonsFor,
  children,
  completion,
  filterLessons,
  dueCards,
  countLabel,
} from "../lib/content";
import {
  PageHeader,
  ProgressBar,
  Badge,
  ActionLink,
  EmptyState,
  LessonRow,
  BackLink,
  Button,
} from "../components/ui";
import type { Content } from "../lib/types";
const phaseIcons = [Sparkles, Target, Layers, Route, BookOpen];
export function Dashboard() {
  const { catalog, preferences, progress } = useApp();
  const lessons = lessonsFor(catalog, preferences.trackId);
  const done = lessons.filter((x) => progress.completed.includes(x.id));
  const next = lessons.find((x) => !progress.completed.includes(x.id));
  const concepts = catalog.filter(
    (x) => x.kind === "CONCEPT" && x.trackIds.includes(preferences.trackId),
  );
  const percent = completion(lessons, progress.completed);
  const cards = dueCards(catalog, progress);
  return (
    <>
      <PageHeader
        eyebrow="YOUR LEARNING WORKSPACE"
        title={`A little progress, ${preferences.name}.`}
        description="Build on what you know. Make room for what’s next."
        action={
          <span className="subtle-chip">
            <span className="green-dot" /> Your pace. Your path.
          </span>
        }
      />
      <section className="hero-panel">
        <div className="hero-copy">
          <Badge>YOUR NEXT STEP</Badge>
          <h2>{next ? next.title : "Your journey, ready for another look."}</h2>
          <p>
            {next
              ? "A small lesson today. A stronger engineering toolkit tomorrow."
              : "You’ve completed the published lessons in this track. Revisit a topic or practice your flashcards."}
          </p>
          <div className="hero-actions">
            <ActionLink to={next ? "/lessons/" + next.id : "/journey"}>
              {next ? "Continue learning" : "Explore journey"}
              <ArrowRight size={17} />
            </ActionLink>
            <span>
              <Clock3 size={15} />
              {next?.minutes ?? preferences.dailyGoal} min
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-center">
            <Layers size={37} />
          </div>
          <span className="art-node node-one">
            <Sparkles size={21} />
          </span>
          <span className="art-node node-two">
            <Check size={23} />
          </span>
          <span className="art-label">DevOps → AI → FDE</span>
        </div>
      </section>
      <div className="stats-grid">
        <Stat
          icon={<BookOpen size={20} />}
          value={`${done.length} / ${lessons.length}`}
          label="Lessons completed"
        />
        <Stat
          icon={<Layers size={20} />}
          value={String(cards.length)}
          label="Cards ready to review"
          to="/flashcards"
        />
        <Stat
          icon={<Target size={20} />}
          value={`${preferences.dailyGoal} min`}
          label="Your daily learning goal"
          to="/settings#daily-goal"
        />
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE BIGGER PICTURE</p>
          <h2>Your learning journey</h2>
        </div>
        <Link className="text-link" to="/journey">
          View full journey <ArrowRight size={16} />
        </Link>
      </div>
      <section className="panel journey-summary">
        <div className="section-heading">
          <div>
            <h3>{catalog.find((x) => x.id === preferences.trackId)?.title}</h3>
            <p>
              {countLabel(done.length, "lesson")} completed ·{" "}
              {lessons.length - done.length} to explore
            </p>
          </div>
          <Badge tone="neutral">{concepts.length} main concepts</Badge>
        </div>
        <ProgressBar value={percent} label="Track progress" />
        <div className="mini-phases">
          {concepts.slice(0, 5).map((x, i) => (
            <Link to={"/journey/" + x.id} key={x.id}>
              <span
                className={
                  completion(lessonsFor(catalog, x.id), progress.completed) ===
                  100
                    ? "complete"
                    : ""
                }
              >
                {completion(lessonsFor(catalog, x.id), progress.completed) ===
                100 ? (
                  <Check size={16} />
                ) : (
                  i + 1
                )}
              </span>
              <strong>{x.title}</strong>
              <small>
                {completion(lessonsFor(catalog, x.id), progress.completed)}%
                complete
              </small>
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-bottom">
        <section className="panel practice-panel">
          <div className="icon-box">
            <Layers size={22} />
          </div>
          <div>
            <Badge tone="neutral">MAKE IT STICK</Badge>
            <h2>A quick recall goes a long way.</h2>
            <p>Revisit the ideas you’ve met with a short flashcard session.</p>
            <Link className="text-link" to="/flashcards">
              Review your cards <ArrowRight size={16} />
            </Link>
          </div>
        </section>
        <section className="panel small-panel">
          <BookOpen size={24} />
          <h3>Need a specific concept?</h3>
          <p>Go straight to the lesson you need, without following the path.</p>
          <Link to="/library" className="text-link">
            Explore the library <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}
function Stat({
  icon,
  value,
  label,
  to,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  to?: string;
}) {
  const body = (
    <>
      <div className="icon-box">{icon}</div>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </>
  );
  return to ? (
    <Link to={to} className="panel stat stat-link">
      {body}
      <ArrowRight className="stat-arrow" size={16} aria-hidden="true" />
    </Link>
  ) : (
    <section className="panel stat">{body}</section>
  );
}
export function Journey() {
  const { catalog, preferences, progress } = useApp();
  const track = catalog.find((x) => x.id === preferences.trackId);
  const concepts = catalog.filter(
    (x) => x.kind === "CONCEPT" && x.trackIds.includes(preferences.trackId),
  );
  const lessons = lessonsFor(catalog, preferences.trackId);
  return (
    <>
      <PageHeader
        eyebrow="LEARNING JOURNEY"
        title="From what you know, to what’s next."
        description="A clear path from DevOps and cloud engineering to AI and forward deployed engineering."
        action={
          <Link to="/settings" className="btn btn-secondary">
            Change track
          </Link>
        }
      />
      <section className="panel journey-progress">
        <div className="section-heading">
          <div>
            <Badge>YOUR TRACK</Badge>
            <h2>{track?.title}</h2>
            <p>
              {lessons.filter((x) => progress.completed.includes(x.id)).length}{" "}
              of {countLabel(lessons.length, "lesson")} completed · Learn at
              your own pace
            </p>
          </div>
          <div className="path-symbol">
            <Route size={30} />
          </div>
        </div>
        <ProgressBar
          value={completion(lessons, progress.completed)}
          label="Overall learning journey"
        />
      </section>
      <div className="section-heading">
        <div>
          <h2>Your path, one concept at a time</h2>
          <p>Start at the beginning or revisit a concept whenever you need.</p>
        </div>
        <span className="muted">{concepts.length} main concepts</span>
      </div>
      <div className="phase-list">
        {concepts.map((x, i) => (
          <ConceptCard key={x.id} concept={x} index={i} />
        ))}
      </div>
      <div className="quiet-note">
        <Sparkles size={17} />
        <span>
          Learning isn’t always linear. Every concept is open for you to
          explore.
        </span>
      </div>
    </>
  );
}
function ConceptCard({ concept, index }: { concept: Content; index: number }) {
  const { catalog, progress } = useApp();
  const lessons = lessonsFor(catalog, concept.id);
  const topics = children(catalog, concept.id, "TOPIC");
  const percent = completion(lessons, progress.completed);
  const Icon = phaseIcons[index % phaseIcons.length];
  return (
    <Link to={"/journey/" + concept.id} className="panel phase-card">
      <div className="phase-marker">
        <Icon size={24} />
      </div>
      <div className="phase-content">
        <div className="phase-top">
          <span className="eyebrow">
            CONCEPT {String(index + 1).padStart(2, "0")}
          </span>
          <Badge tone={percent === 100 ? "green" : "neutral"}>
            {percent === 100
              ? "Completed"
              : percent > 0
                ? "In progress"
                : "Ready to explore"}
          </Badge>
        </div>
        <h2>{concept.title}</h2>
        <p>{concept.summary}</p>
        <div className="phase-meta">
          <span>
            <BookOpen size={14} />
            {countLabel(topics.length, "topic")}
          </span>
          <span>
            <Layers size={14} />
            {countLabel(lessons.length, "lesson")}
          </span>
          <span>
            <Clock3 size={14} />
            {lessons.reduce((sum, l) => sum + l.minutes, 0)} min
          </span>
        </div>
        <ProgressBar
          value={percent}
          label={concept.title + " progress"}
          compact
        />
      </div>
      <ChevronRight size={22} className="phase-arrow" />
    </Link>
  );
}
export function ConceptPage() {
  const { id } = useParams();
  const { catalog, progress } = useApp();
  const concept = catalog.find((x) => x.id === id && x.kind === "CONCEPT");
  if (!concept) return <NotFound />;
  const topics = children(catalog, concept.id, "TOPIC");
  const lessons = lessonsFor(catalog, concept.id);
  return (
    <>
      <BackLink to="/journey">Learning journey</BackLink>
      <PageHeader
        eyebrow="MAIN CONCEPT"
        title={concept.title}
        description={concept.summary}
      />
      <section className="panel summary-strip">
        <span>
          {countLabel(topics.length, "topic")} ·{" "}
          {countLabel(lessons.length, "lesson")}
        </span>
        <ProgressBar
          value={completion(lessons, progress.completed)}
          label="Concept progress"
        />
      </section>
      <div className="section-heading">
        <h2>Topics to explore</h2>
        <span className="muted">Learn one idea at a time</span>
      </div>
      <div className="topic-grid">
        {topics.map((topic, i) => {
          const ls = lessonsFor(catalog, topic.id);
          return (
            <Link
              className="panel topic-card"
              key={topic.id}
              to={"/topics/" + topic.id}
            >
              <div className="topic-card-head">
                <span className="icon-box">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <ArrowRight size={20} />
              </div>
              <h2>{topic.title}</h2>
              <p>{topic.summary}</p>
              <small>
                {ls.length} lessons · {ls.reduce((s, l) => s + l.minutes, 0)}{" "}
                min
              </small>
              <ProgressBar
                value={completion(ls, progress.completed)}
                label={topic.title}
                compact
              />
            </Link>
          );
        })}
      </div>
    </>
  );
}
export function TopicPage() {
  const { id } = useParams();
  const { catalog, progress } = useApp();
  const topic = catalog.find((x) => x.id === id && x.kind === "TOPIC");
  if (!topic) return <NotFound />;
  const lessons = children(catalog, topic.id, "LESSON");
  const concept = catalog.find((x) => x.id === topic.parentId);
  return (
    <>
      <BackLink to={"/journey/" + topic.parentId}>
        {concept?.title || "Main concept"}
      </BackLink>
      <PageHeader
        eyebrow="TOPIC"
        title={topic.title}
        description={topic.summary}
      />
      <section className="panel summary-strip">
        <span>
          {lessons.length} short lessons ·{" "}
          {lessons.reduce((s, l) => s + l.minutes, 0)} min
        </span>
        <ProgressBar
          value={completion(lessons, progress.completed)}
          label="Topic progress"
        />
      </section>
      <section className="panel lesson-list">
        {lessons.map((l, i) => (
          <LessonRow
            key={l.id}
            {...l}
            number={i + 1}
            done={progress.completed.includes(l.id)}
          />
        ))}
      </section>
    </>
  );
}
export function Library() {
  const { catalog, preferences, progress } = useApp();
  const [params, setParams] = useSearchParams();
  const appliedQuery = params.get("q") || "";
  const concept = params.get("concept") || "";
  const savedOnly = params.get("saved") === "1";
  const [query, setQuery] = useState(appliedQuery);
  useEffect(() => {
    setQuery(appliedQuery);
  }, [appliedQuery]);
  const updateFilters = (changes: Record<string, string>) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    });
  };
  const search = (e: FormEvent) => {
    e.preventDefault();
    updateFilters({ q: query.trim() });
  };
  const lessons = filterLessons(
    catalog,
    appliedQuery,
    concept,
    savedOnly,
    preferences.saved,
  );
  return (
    <>
      <PageHeader
        eyebrow="RESOURCE LIBRARY"
        title="The right idea, when you need it."
        description="Find a lesson, revisit a concept, or follow your curiosity. It’s all connected to your journey."
      />
      <section className="library-controls">
        <form
          className="library-search"
          role="search"
          aria-label="Search resource library"
          onSubmit={search}
        >
          <div className="search-input">
            <Search size={19} aria-hidden="true" />
            <input
              aria-label="Search lessons"
              placeholder="Search concepts, topics, or lessons…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  updateFilters({ q: "" });
                }}
              >
                ×
              </button>
            )}
          </div>
          <Button type="submit">
            <Search size={16} />
            Search
          </Button>
        </form>
        <select
          aria-label="Filter by main concept"
          value={concept}
          onChange={(e) => updateFilters({ concept: e.target.value })}
        >
          <option value="">All main concepts</option>
          {catalog
            .filter((x) => x.kind === "CONCEPT")
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
        </select>
      </section>
      <div className="library-tabs">
        <button
          className={!savedOnly ? "active" : ""}
          aria-pressed={!savedOnly}
          onClick={() => updateFilters({ saved: "" })}
        >
          All resources
        </button>
        <button
          className={savedOnly ? "active" : ""}
          aria-pressed={savedOnly}
          onClick={() => updateFilters({ saved: "1" })}
        >
          <Bookmark size={15} />
          Saved lessons{" "}
          <span>
            {filterLessons(catalog, "", "", true, preferences.saved).length}
          </span>
        </button>
      </div>
      <div className="section-heading">
        <h2>
          {savedOnly
            ? "Your saved lessons"
            : appliedQuery
              ? "Search results"
              : "Explore the library"}
        </h2>
        <span className="muted" role="status">
          {countLabel(lessons.length, "lesson")}
        </span>
      </div>
      {lessons.length ? (
        <div className="resource-grid">
          {lessons.map((l) => (
            <Link
              to={"/lessons/" + l.id}
              key={l.id}
              className="panel resource-card"
            >
              <div className="resource-card-top">
                <span className="icon-box">
                  <BookOpen size={20} />
                </span>
                {progress.completed.includes(l.id) ? (
                  <Badge tone="green">
                    <Check size={12} />
                    Completed
                  </Badge>
                ) : (
                  <Badge tone="neutral">Lesson</Badge>
                )}
              </div>
              <small>{catalog.find((x) => x.id === l.parentId)?.title}</small>
              <h3>{l.title}</h3>
              <p>{l.summary}</p>
              <div className="resource-card-footer">
                <span>
                  <Clock3 size={14} />
                  {l.minutes} min read
                </span>
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            savedOnly && !appliedQuery && !concept
              ? "A place for your useful ideas"
              : "No lessons found"
          }
          description={
            savedOnly && !appliedQuery && !concept
              ? "Save any lesson using the bookmark button to find it here."
              : "Try another phrase or choose a different concept."
          }
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setParams({});
              }}
            >
              Show all lessons
            </Button>
          }
        />
      )}
    </>
  );
}
export function NotFound() {
  return (
    <EmptyState
      title="This page isn’t available"
      description="The content may still be in draft or may have moved."
      action={<ActionLink to="/journey">Back to your journey</ActionLink>}
    />
  );
}
