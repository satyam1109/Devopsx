import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  GraduationCap,
  Target,
  BookOpen,
  Layers,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  PageHeader,
  Badge,
  Button,
  ErrorNotice,
  ProgressBar,
  Field,
  ActionLink,
} from "../components/ui";
import { completion, lessonsFor } from "../lib/content";
import { message } from "../lib/api";
export function Settings() {
  const { preferences, setPreferences, catalog, guest } = useApp();
  const [draft, setDraft] = useState(preferences),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await setPreferences(draft);
      setSaved(true);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="PREFERENCES"
        title="Make learning fit your day."
        description="A few simple choices to shape your personal learning space."
      />
      <form className="panel settings-form" onSubmit={submit}>
        <h2>Your learning preferences</h2>
        <Field label="What should we call you?">
          <input
            aria-label="Your name"
            required
            maxLength={60}
            value={draft.name}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, name: e.target.value });
            }}
          />
        </Field>
        <Field
          label="Your learning track"
          hint="You can switch tracks at any time. Shared lesson progress carries across."
        >
          <select
            aria-label="Learning track"
            value={draft.trackId}
            onChange={(e) => {
              setSaved(false);
              setDraft({ ...draft, trackId: e.target.value });
            }}
          >
            {catalog
              .filter((x) => x.kind === "TRACK")
              .map((x) => (
                <option value={x.id} key={x.id}>
                  {x.title}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Daily learning goal">
          <div className="goal-options">
            {[10, 15, 30, 45].map((n) => (
              <button
                type="button"
                aria-pressed={draft.dailyGoal === n}
                className={draft.dailyGoal === n ? "selected" : ""}
                key={n}
                onClick={() => {
                  setSaved(false);
                  setDraft({ ...draft, dailyGoal: n });
                }}
              >
                {n} min
              </button>
            ))}
          </div>
        </Field>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <Button type="submit" busy={busy}>
            Save preferences
          </Button>
          {saved && (
            <span className="success-text" role="status">
              <Check size={17} />
              Preferences saved
            </span>
          )}
        </div>
      </form>
      <section className="panel demo-info">
        <Badge tone="neutral">{guest ? "GUEST DEMO" : "LOCAL DEMO"}</Badge>
        <h3>A space to try the experience</h3>
        <p>
          {guest
            ? "Sample lessons are loaded from our learning service. Your name, preferences, saved lessons, and study progress stay in this browser. Clearing site data resets them; they do not sync across devices. Real sign-in and admin access will be added later."
            : "This version uses sample lessons and a shared local demo profile. Real accounts and production content will be connected in a later release."}
        </p>
        <Link className="text-link" to="/admin">
          Open the admin portal <ArrowRight size={15} />
        </Link>
      </section>
    </>
  );
}
export function Onboarding() {
  const { preferences, setPreferences, catalog, guest } = useApp();
  const [name, setName] = useState(
      preferences.name === "Alex" ? "" : preferences.name,
    ),
    [track, setTrack] = useState(preferences.trackId),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await setPreferences({
        ...preferences,
        name: name.trim() || "Alex",
        trackId: track,
        onboarded: true,
      });
      navigate("/");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="welcome-page">
      <Link to="/" className="brand">
        <span className="brand-mark">
          D<span>↗</span>
        </span>
        Devopsx.si
      </Link>
      <section className="welcome-card" id="main-content">
        <div className="icon-box large">
          <GraduationCap size={28} />
        </div>
        <Badge>YOUR NEXT CHAPTER</Badge>
        <h1>
          You already know how to build.
          <br />
          Let’s add AI to your toolkit.
        </h1>
        <p>
          A clear learning path, useful resources, and quick flashcards.
          <br />
          Start small. Build understanding as you go.
        </p>
        <form onSubmit={submit}>
          <Field label="Your name (optional)">
            <input
              autoFocus
              aria-label="Your name"
              maxLength={60}
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Where would you like to begin?">
            <select
              aria-label="Choose a learning track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
            >
              {catalog
                .filter((x) => x.kind === "TRACK")
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
            </select>
          </Field>
          <ErrorNotice error={error} />
          <Button type="submit" busy={busy}>
            Start learning <ArrowRight size={17} />
          </Button>
        </form>
        <small>
          {guest
            ? "Guest demo · Sample content only. Progress is saved in this browser."
            : "You can change your track at any time. Demo content only."}
        </small>
      </section>
    </div>
  );
}
export function ProgressPage() {
  const { catalog, progress, preferences } = useApp();
  const lessons = lessonsFor(catalog, preferences.trackId);
  const completed = lessons.filter((x) => progress.completed.includes(x.id));
  const reviews = progress.reviews.reduce((s, r) => s + r.repetitions, 0);
  return (
    <>
      <PageHeader
        eyebrow="MY PROGRESS"
        title="Every small step adds up."
        description="See what you’ve explored and choose where to go next."
      />
      <div className="stats-grid">
        <section className="panel stat">
          <BookOpen size={22} />
          <div>
            <strong>{completed.length}</strong>
            <p>Lessons completed</p>
          </div>
        </section>
        <section className="panel stat">
          <Layers size={22} />
          <div>
            <strong>{reviews}</strong>
            <p>Flashcard reviews</p>
          </div>
        </section>
        <section className="panel stat">
          <Target size={22} />
          <div>
            <strong>{completed.reduce((s, l) => s + l.minutes, 0)} min</strong>
            <p>Completed reading time</p>
          </div>
        </section>
      </div>
      <section className="panel progress-detail">
        <h2>{catalog.find((x) => x.id === preferences.trackId)?.title}</h2>
        <ProgressBar
          value={completion(lessons, progress.completed)}
          label="Track progress"
        />
        {catalog
          .filter(
            (x) =>
              x.kind === "CONCEPT" && x.trackIds.includes(preferences.trackId),
          )
          .map((x) => (
            <div className="progress-detail-row" key={x.id}>
              <Link to={"/journey/" + x.id}>{x.title}</Link>
              <ProgressBar
                value={completion(
                  lessonsFor(catalog, x.id),
                  progress.completed,
                )}
                label={x.title}
              />
            </div>
          ))}
      </section>
      <div className="quiet-note">
        <Check size={18} />
        Your progress follows the lesson, including when it appears in another
        track.
      </div>
      <ActionLink to="/journey">
        Continue your journey <ArrowRight size={17} />
      </ActionLink>
    </>
  );
}
