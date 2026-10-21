import {
  useId,
  useEffect,
  useRef,
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  LoaderCircle,
  X,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
export function Button({
  variant = "primary",
  busy = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`btn btn-${variant} ${className}`}
    >
      {busy && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
export function ActionLink({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`btn btn-${secondary ? "secondary" : "primary"}`} to={to}>
      {children}
    </Link>
  );
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function ProgressBar({
  value,
  label = "Progress",
  compact = false,
}: {
  value: number;
  label?: string;
  compact?: boolean;
}) {
  const percent = Math.min(100, Math.max(0, value || 0));
  return (
    <div className={`progress-line ${compact ? "compact" : ""}`}>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${percent}%` }} />
      </div>
      <span>{percent}% completed</span>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorNotice({ error }: { error: string }) {
  return error ? (
    <div role="alert" className="error-notice">
      <AlertCircle size={18} />
      {error}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="animate-spin" />
      <span>Getting your workspace ready…</span>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const direct =
    isValidElement<{ id?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  return (
    <div className="field">
      {direct ? (
        <label htmlFor={id}>{label}</label>
      ) : (
        <span className="field-label">{label}</span>
      )}
      {direct ? cloneElement(children, { id }) : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const elements = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ) || [],
        );
        const first = elements[0],
          last = elements[elements.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <header>
          <h2>{title}</h2>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function LessonRow({
  id,
  title,
  summary,
  minutes,
  done = false,
  number,
}: {
  id: string;
  title: string;
  summary?: string;
  minutes: number;
  done?: boolean;
  number?: number;
}) {
  return (
    <Link to={"/lessons/" + id} className="lesson-row">
      <span className={`lesson-number ${done ? "done" : ""}`}>
        {done ? <Check size={17} /> : (number ?? <BookOpen size={17} />)}
      </span>
      <div>
        <h3>{title}</h3>
        {summary && <p>{summary}</p>}
        <small>{minutes} min read</small>
      </div>
      <ArrowRight size={19} />
    </Link>
  );
}
export function BackLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}
