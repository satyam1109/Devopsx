import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { api, session as getSession, enterDemo, message } from "../lib/api";
import type { Content, Preferences, Progress, Session } from "../lib/types";
import {
  newGuestState,
  readGuest,
  writeGuest,
  reviewGuest,
  type GuestState,
} from "../lib/guest";
type State = {
  catalog: Content[];
  preferences: Preferences;
  progress: Progress;
  session: Session;
  guest: boolean;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  setPreferences: (p: Preferences) => Promise<void>;
  complete: (id: string, value: boolean) => Promise<void>;
  save: (id: string) => Promise<void>;
  switchRole: (role: "LEARNER" | "ADMIN") => Promise<void>;
  review: (id: string, rating: number) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const guestState = useRef(newGuestState());
  const [catalog, setCatalog] = useState<Content[]>([]),
    [preferences, updatePreferences] = useState<Preferences>({
      name: "Alex",
      trackId: "track-ai",
      dailyGoal: 15,
      saved: [],
      onboarded: false,
    }),
    [progress, setProgress] = useState<Progress>({
      completed: [],
      reviews: [],
    }),
    [session, setSession] = useState<Session>({
      role: "ANONYMOUS",
      csrfToken: "",
      demo: false,
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const guest = session.role === "ANONYMOUS" && !session.demo;
  const commitGuest = (next: GuestState) => {
    writeGuest(next);
    guestState.current = next;
    updatePreferences(next.preferences);
    setProgress(next.progress);
  };
  const refresh = useCallback(async () => {
    try {
      let s = await getSession();
      if (s.role === "ANONYMOUS" && s.demo) s = await enterDemo("LEARNER");
      setSession(s);
      const browserGuest = s.role === "ANONYMOUS" && !s.demo;
      const stored = browserGuest ? readGuest() : null;
      const [c, p, r] = await Promise.all([
        api<Content[]>("/catalog"),
        stored
          ? Promise.resolve(stored.preferences)
          : api<Preferences>("/preferences"),
        stored ? Promise.resolve(stored.progress) : api<Progress>("/progress"),
      ]);
      setCatalog(c);
      const normalized = c.some((x) => x.id === p.trackId && x.kind === "TRACK")
        ? p
        : { ...p, trackId: c.find((x) => x.kind === "TRACK")?.id || "" };
      updatePreferences(normalized);
      setProgress(r);
      if (browserGuest)
        guestState.current = { preferences: normalized, progress: r };
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const setPreferences = async (p: Preferences) => {
    if (guest) {
      commitGuest({ ...guestState.current, preferences: p });
      return;
    }
    const result = await api<Preferences>("/preferences", {
      method: "PUT",
      body: JSON.stringify(p),
    });
    updatePreferences(result);
  };
  const complete = async (id: string, value: boolean) => {
    if (guest) {
      const current = guestState.current;
      const completed = current.progress.completed.filter((x) => x !== id);
      commitGuest({
        ...current,
        progress: {
          ...current.progress,
          completed: value ? [...completed, id] : completed,
        },
      });
      return;
    }
    await api("/progress/lessons/" + id, { method: value ? "PUT" : "DELETE" });
    setProgress(await api<Progress>("/progress"));
  };
  const save = async (id: string) =>
    setPreferences({
      ...preferences,
      saved: preferences.saved.includes(id)
        ? preferences.saved.filter((x) => x !== id)
        : [...preferences.saved, id],
    });
  const switchRole = async (role: "LEARNER" | "ADMIN") => {
    if (!session.demo)
      throw new Error(
        "Admin demo access is available only in the local development environment.",
      );
    setSession(await enterDemo(role));
    await refresh();
  };
  const review = async (id: string, rating: number) => {
    if (guest) {
      commitGuest({
        ...guestState.current,
        progress: reviewGuest(guestState.current.progress, id, rating),
      });
      return;
    }
    await api("/reviews", {
      method: "POST",
      body: JSON.stringify({ cardId: id, rating }),
    });
    setProgress(await api<Progress>("/progress"));
  };
  return (
    <Context.Provider
      value={{
        catalog,
        preferences,
        progress,
        session,
        guest,
        loading,
        error,
        refresh,
        setPreferences,
        complete,
        save,
        switchRole,
        review,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider missing");
  return value;
};
