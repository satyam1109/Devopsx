// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Workspace } from "../layouts/Workspace";
import { AppProvider } from "../context/AppContext";
import { Dashboard, Library } from "./LearningPages";
import { ProfilePage } from "./ProfilePage";
import { Settings } from "./AccountPages";
import { Flashcards } from "./Flashcards";
import { api, session } from "../lib/api";
import { blankFlashcard } from "../lib/personalFlashcards";
import { newGuestState } from "../lib/guest";
import type { Content, Preferences } from "../lib/types";

vi.mock("../lib/api", () => ({
  api: vi.fn(),
  session: vi.fn(),
  enterDemo: vi.fn(),
  message: (e: Error) => e.message,
}));
const make = (
  id: string,
  kind: Content["kind"],
  title: string,
  parentId: string | null = null,
  extra: Partial<Content> = {},
): Content => ({ ...blankFlashcard(), id, kind, title, parentId, ...extra });
const catalog = [
  make("track-ai", "TRACK", "AI-enabled DevOps"),
  make("fundamentals", "CONCEPT", "AI Fundamentals", null, {
    trackIds: ["track-ai"],
  }),
  make("models", "TOPIC", "Working with models", "fundamentals"),
  make("models-1", "LESSON", "Language model basics", "models", { minutes: 5 }),
  make("models-2", "LESSON", "Tokens and context", "models", { minutes: 7 }),
];
let preferences: Preferences;
const mount = (url = "/") =>
  render(
    <AppProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<Workspace />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<Settings />} />
            <Route path="flashcards" element={<Flashcards />} />
            <Route path="lessons/:id" element={<h1>Lesson reader</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  HTMLElement.prototype.scrollIntoView = vi.fn();
  preferences = {
    ...newGuestState().preferences,
    name: "Maya",
    onboarded: true,
    saved: ["models-1", "unpublished-lesson"],
  };
  vi.mocked(session).mockResolvedValue({
    role: "LEARNER",
    csrfToken: "test",
    demo: true,
  });
  vi.mocked(api).mockImplementation(async (path, options) => {
    if (path === "/catalog") return structuredClone(catalog) as never;
    if (path === "/preferences") {
      if (options?.method === "PUT")
        preferences = JSON.parse(options.body as string);
      return structuredClone(preferences) as never;
    }
    if (path === "/progress")
      return { completed: ["models-1"], reviews: [] } as never;
    throw new Error(path);
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("learner navigation", () => {
  it("opens the current learner profile from the avatar and shows available saved lessons", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("heading", { name: "A little progress, Maya." });
    expect(
      screen.getByRole("link", { name: /D.*Devopsx/ }).textContent,
    ).not.toContain(".si");
    await user.click(
      screen.getByRole("link", { name: "Open profile for Maya" }),
    );
    await screen.findByRole("heading", {
      name: "Your learning, all in one place.",
    });
    expect(screen.getByRole("heading", { name: "Maya" })).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "Learner details" })).getByText(
        "1 of 2 in this track",
      ),
    ).toBeTruthy();
    await user.click(screen.getByRole("link", { name: "1 saved lesson" }));
    await screen.findByRole("heading", { name: "Your saved lessons" });
    expect(
      screen.getByRole("heading", { name: "Language model basics" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Tokens and context" }),
    ).toBeNull();
    await user.click(screen.getByRole("link", { name: "View your profile" }));
    const savedSection = screen.getByRole("region", { name: "Saved items" });
    await user.click(
      within(savedSection).getByRole("link", { name: /Language model basics/ }),
    );
    await screen.findByRole("heading", { name: "Lesson reader" });
  });

  it("links the dashboard tiles and persists a changed daily goal", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByRole("heading", { name: "A little progress, Maya." });
    await user.click(
      screen.getByRole("link", { name: /Cards ready to review/ }),
    );
    await screen.findByRole("heading", {
      name: "A little recall. A lasting idea.",
    });
    await user.click(screen.getByRole("link", { name: "Overview" }));
    await user.click(
      screen.getByRole("link", { name: /Your daily learning goal/ }),
    );
    await screen.findByRole("heading", { name: "Make learning fit your day." });
    await user.click(screen.getByRole("button", { name: "30 min" }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    await screen.findByText("Preferences saved");
    expect(preferences.dailyGoal).toBe(30);
    await user.click(screen.getByRole("link", { name: "Overview" }));
    expect(
      screen.getByRole("link", { name: /30 min.*Your daily learning goal/ }),
    ).toBeTruthy();
  });

  it("searches with the button or Enter, clears results, and finds parent concept names", async () => {
    const user = userEvent.setup();
    mount("/library");
    await screen.findByRole("heading", { name: "Explore the library" });
    const field = screen.getByRole("textbox", { name: "Search lessons" });
    await user.type(field, "Tokens");
    expect(
      screen.getByRole("heading", { name: "Language model basics" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Search" }));
    await screen.findByRole("heading", { name: "Search results" });
    expect(
      screen.queryByRole("heading", { name: "Language model basics" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Tokens and context" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    await user.type(field, "AI Fundamentals{Enter}");
    expect(
      screen.getByRole("heading", { name: "Language model basics" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Tokens and context" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    await user.type(field, "Nothing matches{Enter}");
    await screen.findByText("No lessons found");
    await user.click(screen.getByRole("button", { name: "Show all lessons" }));
    expect(
      screen.getByRole("heading", { name: "Tokens and context" }),
    ).toBeTruthy();
  });

  it("handles a profile with no available saved items", async () => {
    preferences.saved = ["unpublished-lesson"];
    mount("/profile");
    await screen.findByText("Keep useful lessons close.");
    expect(
      screen.getByRole("link", { name: "Explore the library" }),
    ).toBeTruthy();
  });
});
