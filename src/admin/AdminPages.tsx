import { useState, useEffect, type FormEvent } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
  useBlocker,
} from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Save,
  Eye,
  Trash2,
  Image,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  Upload,
  Check,
  Layers,
  Route,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api, message } from "../lib/api";
import type { Content, Kind, Block, Media } from "../lib/types";
import {
  PageHeader,
  Badge,
  Button,
  ErrorNotice,
  Loading,
  Field,
  Modal,
  EmptyState,
  ActionLink,
} from "../components/ui";
import { LessonBody } from "../components/LessonBody";
const kinds: Kind[] = ["TRACK", "CONCEPT", "TOPIC", "LESSON", "FLASHCARD"];
export const kindLabel = (kind: string) =>
  ({
    TRACK: "Track",
    CONCEPT: "Main concept",
    TOPIC: "Topic",
    LESSON: "Lesson",
    FLASHCARD: "Flashcard",
  })[kind] || kind;
export function AdminLayout() {
  const { session, switchRole } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  const enter = async () => {
    setBusy(true);
    try {
      await switchRole("ADMIN");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  if (session.role !== "ADMIN")
    return (
      <>
        <PageHeader
          eyebrow="CONTENT WORKSPACE"
          title="Good learning starts with good content."
          description="Manage the structure and material your learners will explore."
        />
        <section className="panel admin-gate">
          <span className="icon-box large">
            <ShieldCheck size={28} />
          </span>
          <h2>
            {session.demo
              ? "Explore the admin portal"
              : "Admin access is not available yet"}
          </h2>
          <p>
            {session.demo
              ? "This local demo lets you manage tracks, main concepts, topics, lessons, flashcards, and images. Changes are saved in the local database."
              : "You can explore all published sample lessons in the learning workspace. Content management will open after secure administrator sign-in is connected."}
          </p>
          <Badge tone="amber">
            {session.demo
              ? "Demo access · Shared local workspace"
              : "Administrator sign-in pending"}
          </Badge>
          <p className="small">
            Production sign-in and user roles will be connected before release.
          </p>
          <ErrorNotice error={error} />
          {session.demo ? (
            <Button onClick={() => void enter()} busy={busy}>
              Enter admin demo <ArrowRight size={17} />
            </Button>
          ) : (
            <ActionLink to="/journey">
              Explore the Learning Journey <ArrowRight size={17} />
            </ActionLink>
          )}
        </section>
      </>
    );
  return (
    <>
      <div className="admin-banner">
        <span>
          <ShieldCheck size={16} />
          Content administration <Badge tone="neutral">Demo</Badge>
        </span>
        <Button
          variant="ghost"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await switchRole("LEARNER");
              navigate("/");
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Exit admin <ArrowRight size={15} />
        </Button>
      </div>
      <ErrorNotice error={error} />
      <nav className="admin-tabs" aria-label="Admin navigation">
        <NavLink to="/admin" end>
          Overview
        </NavLink>
        <NavLink to="/admin/content">Content hierarchy</NavLink>
        <NavLink to="/admin/media">Media library</NavLink>
      </nav>
      <Outlet />
    </>
  );
}
function useContent() {
  const [items, setItems] = useState<Content[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      setItems(await api<Content[]>("/admin/content"));
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return { items, loading, error, load };
}
export function AdminOverview() {
  const { items, loading, error } = useContent();
  if (loading) return <Loading />;
  return (
    <>
      <PageHeader
        eyebrow="ADMIN OVERVIEW"
        title="Shape the learning experience."
        description="Build a clear hierarchy, add the material, and publish when it’s ready."
        action={
          <ActionLink to="/admin/content/new?kind=TRACK">
            <Plus size={16} />
            Create a track
          </ActionLink>
        }
      />
      <ErrorNotice error={error} />
      <div className="admin-stats">
        {kinds.map((kind) => (
          <Link className="panel" key={kind} to={"/admin/content?kind=" + kind}>
            <span className="muted">{kindLabel(kind)}s</span>
            <strong>{items.filter((x) => x.kind === kind).length}</strong>
            <small>
              {
                items.filter((x) => x.kind === kind && x.status === "DRAFT")
                  .length
              }{" "}
              drafts <ArrowRight size={14} />
            </small>
          </Link>
        ))}
      </div>
      <section className="panel admin-guide">
        <Badge>CONTENT STRUCTURE</Badge>
        <h2>One structure. One source of truth.</h2>
        <div className="hierarchy-guide">
          {["Track", "Main concept", "Topic", "Lesson"].map((x, i) => (
            <span key={x}>
              <strong>{String(i + 1).padStart(2, "0")}</strong>
              {x}
              {i < 3 && <ArrowRight size={16} />}
            </span>
          ))}
        </div>
        <p>
          Organize main concepts within tracks, add topics, then create short
          lessons. Add images and external links in the lesson editor.
          Flashcards belong to lessons.
        </p>
        <p>
          Save work as a draft or publish it. Learners see content only when its
          full hierarchy is published. The journey and resource library open the
          same lesson.
        </p>
      </section>
      <div className="section-heading">
        <h2>Drafts to pick up</h2>
        <Link className="text-link" to="/admin/content">
          All content <ArrowRight size={16} />
        </Link>
      </div>
      <section className="panel admin-list">
        {items
          .filter((x) => x.status === "DRAFT")
          .slice(0, 5)
          .map((x) => (
            <Link key={x.id} to={"/admin/content/" + x.id}>
              <FileText size={19} />
              <div>
                <strong>{x.title}</strong>
                <small>{kindLabel(x.kind)}</small>
              </div>
              <Badge tone="amber">Draft</Badge>
              <ArrowRight size={16} />
            </Link>
          ))}
        {!items.some((x) => x.status === "DRAFT") && (
          <p className="muted">No drafts yet. Create content to begin.</p>
        )}
      </section>
    </>
  );
}
export function AdminContent() {
  const { items, loading, error, load } = useContent();
  const [params, setParams] = useSearchParams();
  const kind = params.get("kind") || "",
    parent = params.get("parent") || "";
  const [query, setQuery] = useState("");
  const filtered = items.filter(
    (x) =>
      (!kind || x.kind === kind) &&
      (!parent || x.parentId === parent || x.trackIds.includes(parent)) &&
      x.title.toLowerCase().includes(query.toLowerCase()),
  );
  if (loading) return <Loading />;
  return (
    <>
      <PageHeader
        eyebrow="CONTENT HIERARCHY"
        title="A clear home for every idea."
        description="Create, edit, and publish your tracks, concepts, topics, lessons, and flashcards."
        action={
          <ActionLink
            to={
              "/admin/content/new?kind=" +
              (kind || "TRACK") +
              (parent ? "&parent=" + parent : "")
            }
          >
            <Plus size={17} />
            Create {kind ? kindLabel(kind).toLowerCase() : "content"}
          </ActionLink>
        }
      />
      <ErrorNotice error={error} />
      <div className="content-type-tabs">
        <button className={!kind ? "active" : ""} onClick={() => setParams({})}>
          All content <span>{items.length}</span>
        </button>
        {kinds.map((k) => (
          <button
            className={kind === k ? "active" : ""}
            key={k}
            onClick={() => setParams({ kind: k })}
          >
            {kindLabel(k)}s{" "}
            <span>{items.filter((x) => x.kind === k).length}</span>
          </button>
        ))}
      </div>
      <div className="admin-filters">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Search admin content"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find content by title…"
          />
        </label>
        <select
          aria-label="Filter by parent"
          value={parent}
          onChange={(e) => {
            const p = new URLSearchParams(params);
            if (e.target.value) p.set("parent", e.target.value);
            else p.delete("parent");
            setParams(p);
          }}
        >
          <option value="">All parents</option>
          {items
            .filter((x) => !["LESSON", "FLASHCARD"].includes(x.kind))
            .map((x) => (
              <option key={x.id} value={x.id}>
                {kindLabel(x.kind)}: {x.title}
              </option>
            ))}
        </select>
        <Button variant="ghost" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Title / structure</th>
              <th>Type</th>
              <th>Status</th>
              <th>Order</th>
              <th>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => (
              <tr key={x.id}>
                <td>
                  <Link className="table-title" to={"/admin/content/" + x.id}>
                    {x.title}
                  </Link>
                  <small>
                    {x.parentId
                      ? items.find((p) => p.id === x.parentId)?.title
                      : x.kind === "CONCEPT"
                        ? x.trackIds
                            .map((t) => items.find((p) => p.id === t)?.title)
                            .join(" · ")
                        : "Top level"}
                  </small>
                </td>
                <td>{kindLabel(x.kind)}</td>
                <td>
                  <Badge
                    tone={
                      x.status === "PUBLISHED"
                        ? "green"
                        : x.status === "DRAFT"
                          ? "amber"
                          : "neutral"
                    }
                  >
                    {x.status.toLowerCase()}
                  </Badge>
                </td>
                <td>{x.position}</td>
                <td>
                  <Link
                    aria-label={"Edit " + x.title}
                    className="text-link"
                    to={"/admin/content/" + x.id}
                  >
                    Edit <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <EmptyState
            title="No content here yet"
            description="Try another filter or create a new item."
          />
        )}
      </div>
      <p className="small muted">
        Order controls the sequence within a parent. Archiving a parent also
        hides its descendants from learners.
      </p>
    </>
  );
}
function blank(kind: Kind, parent: string): Content {
  return {
    id: "",
    kind,
    parentId: kind === "TRACK" || kind === "CONCEPT" ? null : parent || null,
    trackIds: kind === "CONCEPT" && parent ? [parent] : [],
    title: "",
    summary: "",
    status: "DRAFT",
    position: 0,
    minutes: 5,
    tags: [],
    blocks: [],
    cardType: kind === "FLASHCARD" ? "concept" : null,
    question: "",
    answer: "",
    options: [],
    correctOption: 0,
    correctOrder: [],
  };
}
export function ContentEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { items, loading, error: loadError } = useContent();
  const { refresh } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Content | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState(false),
    [deleting, setDeleting] = useState(false),
    [dirty, setDirty] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const blocker = useBlocker(dirty && !busy);
  useEffect(() => {
    if (!loading) {
      const kind = kinds.includes(params.get("kind") as Kind)
        ? (params.get("kind") as Kind)
        : "LESSON";
      const existing = id ? items.find((x) => x.id === id) : null;
      const created = blank(kind, params.get("parent") || "");
      if (!id)
        created.position =
          Math.max(
            -1,
            ...items
              .filter((x) => x.kind === kind && x.parentId === created.parentId)
              .map((x) => x.position),
          ) + 1;
      setDraft(id ? existing || null : created);
    }
  }, [loading, id]);
  useEffect(() => {
    void api<Media[]>("/admin/media")
      .then(setMedia)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  if (loading) return <Loading />;
  if (!draft)
    return (
      <EmptyState
        title="Content not found"
        description={
          loadError || "Choose an existing item or create a new one."
        }
        action={<ActionLink to="/admin/content">Back to content</ActionLink>}
      />
    );
  const update = (value: Partial<Content>) => {
    setDraft({ ...draft, ...value });
    setDirty(true);
    setNotice("");
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await api<Content>(
        "/admin/content" + (id ? "/" + id : ""),
        { method: id ? "PUT" : "POST", body: JSON.stringify(draft) },
      );
      setDraft(saved);
      setDirty(false);
      await refresh();
      setNotice(
        saved.status === "PUBLISHED"
          ? "Saved and published. Learners can see this when its parent hierarchy is published."
          : "Draft saved. It’s available here in admin.",
      );
      if (!id) navigate("/admin/content/" + saved.id, { replace: true });
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api("/admin/content/" + id, { method: "DELETE" });
      await refresh();
      navigate("/admin/content?kind=" + draft.kind);
    } catch (e) {
      setError(message(e));
      setDeleting(false);
    } finally {
      setBusy(false);
    }
  };
  const changeBlock = (index: number, values: Partial<Block>) =>
    update({
      blocks: draft.blocks.map((b, i) =>
        i === index ? { ...b, ...values } : b,
      ),
    });
  const addBlock = (type: Block["type"]) =>
    update({
      blocks: [
        ...draft.blocks,
        {
          id: crypto.randomUUID(),
          type,
          text: "",
          title: "",
          url: "",
          alt: "",
        },
      ],
    });
  const moveBlock = (index: number, delta: number) => {
    const blocks = [...draft.blocks];
    [blocks[index], blocks[index + delta]] = [
      blocks[index + delta],
      blocks[index],
    ];
    update({ blocks });
  };
  const parents = items.filter(
    (x) =>
      x.kind ===
      (
        { TOPIC: "CONCEPT", LESSON: "TOPIC", FLASHCARD: "LESSON" } as Record<
          string,
          string
        >
      )[draft.kind],
  );
  return (
    <>
      <Link className="back-link" to={"/admin/content?kind=" + draft.kind}>
        <ArrowLeft size={15} />
        All {kindLabel(draft.kind).toLowerCase()}s
      </Link>
      <PageHeader
        eyebrow={
          id ? "EDIT " + kindLabel(draft.kind).toUpperCase() : "CREATE CONTENT"
        }
        title={
          id
            ? draft.title || "Untitled item"
            : "Create a " + kindLabel(draft.kind).toLowerCase()
        }
        description={
          dirty
            ? "You have unsaved changes."
            : "Give every concept a clear place in the learning journey."
        }
        action={
          draft.kind === "LESSON" ? (
            <Button variant="secondary" onClick={() => setPreview(true)}>
              <Eye size={16} />
              Preview lesson
            </Button>
          ) : undefined
        }
      />
      <ErrorNotice error={error || loadError} />
      {notice && (
        <div className="success-notice" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <form onSubmit={save} className="content-editor">
        <section className="panel editor-section">
          <div className="section-heading">
            <h2>Content details</h2>
            <Badge tone="neutral">{kindLabel(draft.kind)}</Badge>
          </div>
          {!id && (
            <Field label="Content type">
              <select
                aria-label="Content type"
                value={draft.kind}
                onChange={(e) => {
                  setDraft(blank(e.target.value as Kind, ""));
                  setDirty(true);
                }}
              >
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {kindLabel(k)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Title">
            <input
              aria-label="Title"
              autoFocus
              required
              maxLength={160}
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder={"Name this " + kindLabel(draft.kind).toLowerCase()}
            />
          </Field>
          <Field label="Short description">
            <textarea
              aria-label="Short description"
              rows={3}
              value={draft.summary}
              onChange={(e) => update({ summary: e.target.value })}
              placeholder="Help the learner understand what they’ll explore."
            />
          </Field>
          {draft.kind === "CONCEPT" && (
            <Field
              label="Learning tracks"
              hint="A main concept can be shared across tracks."
            >
              <div className="checkbox-list">
                {items
                  .filter((x) => x.kind === "TRACK")
                  .map((t) => (
                    <label key={t.id}>
                      <input
                        type="checkbox"
                        checked={draft.trackIds.includes(t.id)}
                        onChange={(e) =>
                          update({
                            trackIds: e.target.checked
                              ? [...draft.trackIds, t.id]
                              : draft.trackIds.filter((x) => x !== t.id),
                          })
                        }
                      />
                      {t.title}
                    </label>
                  ))}
              </div>
            </Field>
          )}
          {parents.length > 0 ? (
            <Field label={"Parent " + kindLabel(parents[0].kind).toLowerCase()}>
              <select
                aria-label="Parent content"
                required
                value={draft.parentId || ""}
                onChange={(e) => update({ parentId: e.target.value })}
              >
                <option value="">Select a parent…</option>
                {parents.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            !["TRACK", "CONCEPT"].includes(draft.kind) && (
              <p className="error-notice">Create a parent item first.</p>
            )
          )}
          <div className="form-grid">
            <Field label="Publishing status">
              <select
                aria-label="Publishing status"
                value={draft.status}
                onChange={(e) =>
                  update({ status: e.target.value as Content["status"] })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <Field label="Display order" hint="Lower numbers appear first.">
              <input
                aria-label="Display order"
                type="number"
                required
                min={0}
                value={draft.position}
                onChange={(e) => update({ position: Number(e.target.value) })}
              />
            </Field>
            {draft.kind === "LESSON" && (
              <Field label="Reading time (minutes)">
                <input
                  aria-label="Reading time"
                  type="number"
                  min={0}
                  max={240}
                  required
                  value={draft.minutes}
                  onChange={(e) => update({ minutes: Number(e.target.value) })}
                />
              </Field>
            )}
          </div>
          <Field label="Tags" hint="Separate tags with commas.">
            <input
              aria-label="Tags"
              value={draft.tags.join(", ")}
              onChange={(e) =>
                update({ tags: e.target.value.split(",").map((x) => x.trim()) })
              }
            />
          </Field>
        </section>
        {draft.kind === "LESSON" && (
          <section className="panel editor-section">
            <div className="section-heading">
              <div>
                <h2>Lesson material</h2>
                <p>
                  Add short sections in the order learners should read them.
                </p>
              </div>
              <Badge tone="neutral">{draft.blocks.length} blocks</Badge>
            </div>
            {draft.blocks.map((b, i) => (
              <div className="block-editor" key={b.id}>
                <header>
                  <Badge tone="neutral">
                    {i + 1} · {b.type}
                  </Badge>
                  <div>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={i === 0}
                      aria-label="Move block up"
                      onClick={() => moveBlock(i, -1)}
                    >
                      <ArrowUp size={15} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={i === draft.blocks.length - 1}
                      aria-label="Move block down"
                      onClick={() => moveBlock(i, 1)}
                    >
                      <ArrowDown size={15} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      aria-label="Remove block"
                      onClick={() =>
                        update({
                          blocks: draft.blocks.filter((_, n) => n !== i),
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </header>
                {!["paragraph", "bullets", "heading"].includes(b.type) && (
                  <Field label="Section title">
                    <input
                      aria-label={"Block " + (i + 1) + " title"}
                      value={b.title || ""}
                      onChange={(e) =>
                        changeBlock(i, { title: e.target.value })
                      }
                    />
                  </Field>
                )}
                {!["image", "link"].includes(b.type) && (
                  <Field
                    label={
                      b.type === "bullets"
                        ? "Bullet points (one per line)"
                        : "Text"
                    }
                  >
                    <textarea
                      rows={b.type === "heading" ? 2 : 4}
                      aria-label={"Block " + (i + 1) + " text"}
                      value={b.text || ""}
                      onChange={(e) => changeBlock(i, { text: e.target.value })}
                    />
                  </Field>
                )}
                {b.type === "code" && (
                  <Field label="Code language">
                    <input
                      aria-label="Code language"
                      value={b.language || ""}
                      onChange={(e) =>
                        changeBlock(i, { language: e.target.value })
                      }
                      placeholder="e.g. yaml, java, text"
                    />
                  </Field>
                )}
                {["image", "link"].includes(b.type) && (
                  <>
                    <Field
                      label={b.type === "image" ? "Image URL" : "External URL"}
                    >
                      <input
                        aria-label={"Block " + (i + 1) + " URL"}
                        required
                        value={b.url || ""}
                        onChange={(e) =>
                          changeBlock(i, { url: e.target.value })
                        }
                        placeholder="https://…"
                      />
                    </Field>
                    {b.type === "image" ? (
                      <>
                        <Field label="Or choose an uploaded image">
                          <select
                            aria-label="Choose uploaded image"
                            value={
                              media.some((x) => x.url === b.url) ? b.url : ""
                            }
                            onChange={(e) => {
                              if (e.target.value)
                                changeBlock(i, { url: e.target.value });
                            }}
                          >
                            <option value="">Select an image…</option>
                            {media.map((x) => (
                              <option key={x.id} value={x.url}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Alternative text">
                          <input
                            aria-label="Alternative text"
                            required
                            value={b.alt || ""}
                            onChange={(e) =>
                              changeBlock(i, { alt: e.target.value })
                            }
                          />
                        </Field>
                        {b.url && (
                          <img
                            className="block-image-preview"
                            src={b.url}
                            alt={b.alt || "Image preview"}
                          />
                        )}
                      </>
                    ) : (
                      <Field label="Link description">
                        <input
                          aria-label="Link description"
                          value={b.text || ""}
                          onChange={(e) =>
                            changeBlock(i, { text: e.target.value })
                          }
                        />
                      </Field>
                    )}
                  </>
                )}
              </div>
            ))}
            <div className="add-blocks">
              {(
                [
                  "paragraph",
                  "heading",
                  "callout",
                  "bullets",
                  "code",
                  "image",
                  "link",
                ] as Block["type"][]
              ).map((t) => (
                <Button
                  type="button"
                  key={t}
                  variant="secondary"
                  onClick={() => addBlock(t)}
                >
                  <Plus size={14} />
                  {t === "link"
                    ? "External link"
                    : t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
            {draft.blocks.length === 0 && (
              <p className="small muted">
                Add your first paragraph, image, or supporting link above.
              </p>
            )}
          </section>
        )}
        {draft.kind === "FLASHCARD" && (
          <FlashcardFields draft={draft} update={update} />
        )}
        <div className="editor-save-bar">
          <span>
            {dirty
              ? "Unsaved changes"
              : id
                ? "All changes saved"
                : "New content"}
          </span>
          {id && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
          <Button type="submit" busy={busy}>
            <Save size={16} />
            {draft.status === "PUBLISHED"
              ? "Save and publish"
              : "Save " + draft.status.toLowerCase()}
          </Button>
        </div>
      </form>
      {blocker.state === "blocked" && (
        <Modal
          title="Leave your unsaved changes?"
          onClose={() => blocker.reset()}
        >
          <p>
            Your changes haven’t been saved yet. Stay here to save them, or
            leave this page and discard the edits.
          </p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => blocker.reset()}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => blocker.proceed()}>
              Discard and leave
            </Button>
          </div>
        </Modal>
      )}
      {preview && (
        <Modal title="Lesson preview" wide onClose={() => setPreview(false)}>
          <div className="preview-content">
            <Badge tone="amber">ADMIN PREVIEW · {draft.status}</Badge>
            <h1>{draft.title}</h1>
            <p className="muted">{draft.summary}</p>
            <LessonBody blocks={draft.blocks} />
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this content?" onClose={() => setDeleting(false)}>
          <p>
            This removes “{draft.title}”. Child content must be moved or deleted
            first. You can archive the item instead to keep its history.
          </p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setDeleting(false)}>
              Keep content
            </Button>
            <Button variant="danger" busy={busy} onClick={() => void remove()}>
              Delete content
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function FlashcardFields({
  draft,
  update,
}: {
  draft: Content;
  update: (v: Partial<Content>) => void;
}) {
  return (
    <section className="panel editor-section">
      <h2>Flashcard content</h2>
      <Field label="Card format">
        <select
          aria-label="Card format"
          value={draft.cardType || "concept"}
          onChange={(e) =>
            update({ cardType: e.target.value as Content["cardType"] })
          }
        >
          {["concept", "scenario", "flaw", "choice", "ordering"].map((x) => (
            <option key={x} value={x}>
              {x === "flaw"
                ? "Spot the flaw"
                : x.charAt(0).toUpperCase() + x.slice(1)}
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
export function MediaLibrary() {
  const [items, setItems] = useState<Media[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [remove, setRemove] = useState<Media | null>(null),
    [notice, setNotice] = useState("");
  const load = async () => {
    try {
      setItems(await api<Media[]>("/admin/media"));
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      await api("/admin/media", { method: "POST", body: form });
      await load();
      setNotice(
        "Image uploaded. You can now select it in a lesson’s image block.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="MEDIA LIBRARY"
        title="Give ideas a visual home."
        description="Upload images once and reuse them across your lessons."
      />
      <ErrorNotice error={error} />
      {notice && (
        <div className="success-notice" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      <label className={`upload-zone ${busy ? "disabled" : ""}`}>
        <Upload size={28} />
        <strong>
          {busy ? "Uploading your image…" : "Choose an image to upload"}
        </strong>
        <span>PNG, JPEG, WebP or GIF · Up to 5 MB</span>
        <input
          type="file"
          aria-label="Upload image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {loading ? (
        <Loading />
      ) : items.length ? (
        <div className="media-grid">
          {items.map((x) => (
            <section className="panel media-card" key={x.id}>
              <img src={x.url} alt={x.name} />
              <div>
                <h3>{x.name}</h3>
                <small>
                  {x.mime} · {x.size < 1024 ? "<1" : Math.round(x.size / 1024)}{" "}
                  KB
                </small>
                <div>
                  <a
                    className="text-link"
                    href={x.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View image <ExternalLink size={14} />
                  </a>
                  <Button
                    variant="ghost"
                    aria-label={"Delete " + x.name}
                    onClick={() => setRemove(x)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="A clean canvas"
          description="Uploaded images will appear here. Add them to any lesson using an image block."
        />
      )}
      {remove && (
        <Modal title="Delete this image?" onClose={() => setRemove(null)}>
          <p>“{remove.name}” can be deleted when it isn’t used by a lesson.</p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Keep image
            </Button>
            <Button
              variant="danger"
              busy={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await api("/admin/media/" + remove.id, { method: "DELETE" });
                  await load();
                } catch (e) {
                  setError(message(e));
                } finally {
                  setBusy(false);
                  setRemove(null);
                }
              }}
            >
              Delete image
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
