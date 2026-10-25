import { ArrowRight, Bookmark, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  filterLessons,
  lessonsFor,
  countLabel,
  completion,
} from "../lib/content";
import {
  ActionLink,
  Badge,
  EmptyState,
  LessonRow,
  PageHeader,
  ProgressBar,
} from "../components/ui";

export function ProfilePage() {
  const { preferences, catalog, progress, guest, personalCards } = useApp();
  const track = catalog.find((x) => x.id === preferences.trackId);
  const lessons = lessonsFor(catalog, preferences.trackId);
  const completed = lessons.filter((x) =>
    progress.completed.includes(x.id),
  ).length;
  const saved = filterLessons(catalog, "", "", true, preferences.saved);
  const reviews = progress.reviews.reduce(
    (total, review) => total + review.repetitions,
    0,
  );
  const personalCount = personalCards.filter((x) =>
    catalog.some((item) => item.id === x.content.id),
  ).length;
  return (
    <>
      <PageHeader
        eyebrow="YOUR PROFILE"
        title="Your learning, all in one place."
        description="Your details, progress, and the ideas you’ve saved for later."
        action={
          <ActionLink to="/settings" secondary>
            <Settings size={16} />
            Edit preferences
          </ActionLink>
        }
      />
      <section className="panel profile-summary" aria-label="Learner details">
        <div className="profile-identity">
          <span className="avatar profile-portrait" aria-hidden="true">
            {preferences.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <Badge tone="neutral">
              {guest ? "Guest learner" : "Demo learner"}
            </Badge>
            <h2>{preferences.name}</h2>
            <p>{track?.title || "Choose a learning track"}</p>
          </div>
        </div>
        <dl className="profile-details">
          <div>
            <dt>Learning track</dt>
            <dd>{track?.title || "Not selected"}</dd>
          </div>
          <div>
            <dt>Daily learning goal</dt>
            <dd>
              <Link className="text-link" to="/settings#daily-goal">
                {preferences.dailyGoal} min a day <ArrowRight size={14} />
              </Link>
            </dd>
          </div>
          <div>
            <dt>Lessons completed</dt>
            <dd>
              {completed} of {lessons.length} in this track
            </dd>
          </div>
          <div>
            <dt>Flashcard reviews</dt>
            <dd>{reviews}</dd>
          </div>
          <div>
            <dt>Personal flashcards and edits</dt>
            <dd>
              <Link className="text-link" to="/flashcards">
                {personalCount} <ArrowRight size={14} />
              </Link>
            </dd>
          </div>
        </dl>
        <ProgressBar
          value={completion(lessons, progress.completed)}
          label="Profile track progress"
        />
        <p className="small muted profile-demo-note">
          {guest
            ? "Guest profile · Preferences and progress are saved in this browser."
            : "Local demo profile · Preferences and lesson progress use the shared local demo database."}{" "}
          Personal flashcards and edits stay in this browser.
        </p>
      </section>
      <section aria-labelledby="saved-items-title">
        <div className="section-heading">
          <div>
            <h2 id="saved-items-title">Saved items</h2>
            <p className="muted small">
              Bookmarked lessons, ready when you need them.
            </p>
          </div>
          <Link className="text-link" to="/library?saved=1">
            <Bookmark size={15} />
            {countLabel(saved.length, "saved lesson")} <ArrowRight size={15} />
          </Link>
        </div>
        {saved.length ? (
          <div className="panel profile-saved-list">
            {saved.map((lesson) => (
              <LessonRow
                key={lesson.id}
                id={lesson.id}
                title={lesson.title}
                summary={lesson.summary}
                minutes={lesson.minutes}
                done={progress.completed.includes(lesson.id)}
              />
            ))}
          </div>
        ) : (
          <div className="panel">
            <EmptyState
              title="Keep useful lessons close."
              description="Use Save lesson while reading to add it to your profile."
              action={
                <ActionLink to="/library">
                  Explore the library <ArrowRight size={16} />
                </ActionLink>
              }
            />
          </div>
        )}
      </section>
    </>
  );
}
