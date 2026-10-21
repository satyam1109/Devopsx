import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Route,
  Library,
  Layers,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  Menu,
  X,
  Search,
  ShieldCheck,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Badge, Button, ErrorNotice, Loading } from "../components/ui";
const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/journey", label: "Learning Journey", icon: Route },
  { to: "/library", label: "Resource Library", icon: Library },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/progress", label: "My Progress", icon: ChartNoAxesCombined },
];
export function Workspace() {
  const { preferences, catalog, loading, error, refresh } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth <= 700);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const changed = () => setMobile(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    navRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      toggleRef.current?.focus();
    };
  }, [open, mobile]);
  const focus = location.pathname.startsWith("/lessons/");
  const track = catalog.find((x) => x.id === preferences.trackId);
  return (
    <div className={`app-shell ${focus ? "focus-mode" : ""}`}>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={navRef}
        inert={mobile && !open}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (mobile && open && e.key === "Tab") {
            const targets = Array.from(
              navRef.current?.querySelectorAll<HTMLElement>("a,button") || [],
            );
            if (e.shiftKey && document.activeElement === targets[0]) {
              e.preventDefault();
              targets.at(-1)?.focus();
            } else if (
              !e.shiftKey &&
              document.activeElement === targets.at(-1)
            ) {
              e.preventDefault();
              targets[0]?.focus();
            }
          }
        }}
        className={`sidebar ${open ? "open" : ""}`}
      >
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            D<span>↗</span>
          </span>
          <span>
            Devopsx<span className="brand-domain">.si</span>
          </span>
        </Link>
        <button
          className="mobile-close"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
        <Link to="/settings" className="track-switch">
          <span className="track-icon">
            <GraduationCap size={19} />
          </span>
          <span>
            <small>YOUR LEARNING TRACK</small>
            <strong>{track?.title || "Choose a track"}</strong>
          </span>
          <ChevronDown size={15} />
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              end={to === "/"}
              key={to}
              to={to}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="learning-note">
            <span className="note-spark">✦</span>
            <strong>A little, every day.</strong>
            <p>
              Build your AI intuition,
              <br />
              one concept at a time.
            </p>
            <Link to="/journey">
              Continue your journey <ArrowUpRight size={14} />
            </Link>
          </div>
          <nav>
            <NavLink to="/settings" onClick={() => setOpen(false)}>
              <Settings size={18} />
              Preferences
            </NavLink>
            <NavLink to="/admin" onClick={() => setOpen(false)}>
              <ShieldCheck size={18} />
              Admin portal
            </NavLink>
          </nav>
          <div className="sidebar-user">
            <span className="avatar">
              {preferences.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <strong>{preferences.name}</strong>
              <small>Personal workspace</small>
            </div>
            <Badge tone="neutral">Demo</Badge>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className={`topbar ${focus ? "lesson-mobile-bar" : ""}`}>
          <button
            ref={toggleRef}
            className="btn btn-ghost mobile-menu"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>
          {!focus && (
            <>
              <span className="topbar-label">
                Your next chapter starts here.
              </span>
              <Link className="top-search" to="/library">
                <Search size={16} />
                <span>Find a concept or lesson</span>
                <kbd>⌕</kbd>
              </Link>
              <Badge tone="neutral">Demo workspace</Badge>
              <span className="avatar small">{preferences.name.charAt(0)}</span>
            </>
          )}
        </header>
        <main
          id="main-content"
          className={focus ? "lesson-main" : "page-content"}
        >
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="connection-error">
              <h1>Let’s reconnect your workspace</h1>
              <p>
                The Spring Boot server needs to be running to load your content.
              </p>
              <ErrorNotice error={error} />
              <Button onClick={() => void refresh()}>Try again</Button>
            </div>
          ) : !preferences.onboarded && location.pathname === "/" ? (
            <Navigate to="/start" replace />
          ) : (
            <Outlet />
          )}
        </main>
        <footer className={focus ? "hidden" : ""}>
          Devopsx.si <span>Built for engineers. Designed for learning.</span>
        </footer>
      </div>
    </div>
  );
}
