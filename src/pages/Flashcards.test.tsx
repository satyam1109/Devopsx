// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Flashcards } from "./Flashcards";
import { AppProvider } from "../context/AppContext";
import { api, session } from "../lib/api";
import { newGuestState } from "../lib/guest";
import {
  blankFlashcard,
  readPersonalFlashcards,
  normalizeFlashcard,
  personalCatalog,
  writePersonalFlashcards,
  PERSONAL_CARDS_KEY,
} from "../lib/personalFlashcards";
import type { Content } from "../lib/types";

vi.mock("../lib/api", () => ({
  api: vi.fn(),
  session: vi.fn(),
  enterDemo: vi.fn(),
  message: (e: Error) => e.message,
}));
const lesson = {
  ...blankFlashcard(),
  id: "models-1",
  kind: "LESSON",
  title: "Language models",
} as Content;
const secondLesson = { ...lesson, id: "models-2", title: "Tokens" };
const sourceCard = {
  ...blankFlashcard(lesson.id),
  id: "card-choice",
  title: "Pick a model",
  question: "Pick a model",
  answer: "The second option is correct.",
  cardType: "choice",
  options: ["A tool", "A model"],
  correctOption: 1,
} as Content;
const shared = [lesson, secondLesson, sourceCard];
const mount = (url = "/flashcards") =>
  render(
    <AppProvider>
      <MemoryRouter initialEntries={[url]}>
        <Flashcards />
      </MemoryRouter>
    </AppProvider>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(session).mockResolvedValue({
    role: "LEARNER",
    csrfToken: "test",
    demo: true,
  });
  vi.mocked(api).mockImplementation(async (path, options) => {
    if (options?.method)
      throw new Error("Personal edits must not write to the shared server");
    if (path === "/catalog") return structuredClone(shared) as never;
    if (path === "/preferences")
      return { ...newGuestState().preferences, onboarded: true } as never;
    if (path === "/progress") return newGuestState().progress as never;
    throw new Error(path);
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("personal flashcards", () => {
  it.each(["local", "guest"])(
    "creates and reviews a personal card in %s mode and restores its schedule after reload",
    async (mode) => {
      if (mode === "guest")
        vi.mocked(session).mockResolvedValue({
          role: "ANONYMOUS",
          csrfToken: "test",
          demo: false,
        });
      const user = userEvent.setup();
      const first = mount("/flashcards?lesson=models-2");
      await screen.findByText("Your collection");
      await user.click(
        screen.getByRole("button", { name: "Create Flashcard" }),
      );
      const dialog = screen.getByRole("dialog", { name: "Create Flashcard" });
      expect(
        (within(dialog).getByLabelText("Lesson") as HTMLSelectElement).value,
      ).toBe("models-2");
      await user.type(
        within(dialog).getByLabelText("Question"),
        "What is a token?",
      );
      await user.type(
        within(dialog).getByLabelText("Answer and explanation"),
        "A unit of text processed by the model.",
      );
      await user.click(
        within(dialog).getByRole("button", {
          name: "Create Flashcard",
        }),
      );
      await screen.findByRole("heading", { name: "What is a token?" });
      await user.click(screen.getByRole("button", { name: /Start review/ }));
      await user.click(screen.getByRole("button", { name: "Reveal answer" }));
      expect(
        screen.getByText("A unit of text processed by the model."),
      ).toBeTruthy();
      await user.click(
        screen.getByRole("button", { name: "3 Good A few days" }),
      );
      await screen.findByText("A little stronger than before.");
      first.unmount();
      mount("/flashcards?lesson=models-2");
      await screen.findByRole("heading", { name: "What is a token?" });
      expect(
        (
          screen.getByRole("button", {
            name: /Start review/,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      const saved = readPersonalFlashcards();
      expect(saved.cards).toHaveLength(1);
      expect(saved.reviews[0]).toMatchObject({
        cardId: saved.cards[0].content.id,
        rating: 3,
        repetitions: 1,
      });
      expect(Date.parse(saved.reviews[0].dueAt)).toBeGreaterThan(Date.now());
      expect(
        vi.mocked(api).mock.calls.every(([, options]) => !options?.method),
      ).toBe(true);
    },
  );

  it("edits choice options and the correct answer without changing the shared original", async () => {
    const originalProgress = {
      completed: [],
      reviews: [
        {
          cardId: sourceCard.id,
          rating: 2,
          repetitions: 3,
          dueAt: "2099-01-01T00:00:00Z",
        },
      ],
    };
    const getData = vi.mocked(api).getMockImplementation()!;
    vi.mocked(api).mockImplementation(async (path, options) =>
      path === "/progress"
        ? (originalProgress as never)
        : getData(path, options),
    );
    const user = userEvent.setup();
    const first = mount();
    await screen.findByText("Your collection");
    await user.click(
      screen.getByRole("button", { name: "Edit flashcard: Pick a model" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Edit Flashcard" });
    await user.clear(within(dialog).getByLabelText("Question"));
    await user.type(
      within(dialog).getByLabelText("Question"),
      "Choose my preferred example",
    );
    await user.clear(within(dialog).getByLabelText("Answer options"));
    await user.type(
      within(dialog).getByLabelText("Answer options"),
      "My model\nMy tool",
    );
    await user.selectOptions(
      within(dialog).getByLabelText("Correct answer"),
      "0",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );
    await screen.findByText("Your edit");
    first.unmount();
    mount();
    await screen.findByRole("heading", { name: "Choose my preferred example" });
    await user.click(
      screen.getByRole("button", { name: "Practice all cards" }),
    );
    await user.click(screen.getByRole("radio", { name: "A My model" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("That’s right")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "3 Good A few days" }));
    await screen.findByText("A little stronger than before.");
    expect(readPersonalFlashcards().reviews[0].repetitions).toBe(4);
    expect(originalProgress.reviews[0].repetitions).toBe(3);
    expect(sourceCard.question).toBe("Pick a model");
    expect(sourceCard.options).toEqual(["A tool", "A model"]);
    expect(readPersonalFlashcards().cards[0].sourceId).toBe(sourceCard.id);
    expect(
      vi.mocked(api).mock.calls.every(([, options]) => !options?.method),
    ).toBe(true);
  });

  it("blocks review shortcuts inside the editor and protects unsaved changes", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText("Your collection");
    await user.click(
      screen.getByRole("button", { name: "Practice all cards" }),
    );
    await user.click(screen.getByRole("radio", { name: "B A model" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.keyboard("3");
    expect(readPersonalFlashcards().reviews).toEqual([]);
    const dialog = screen.getByRole("dialog", { name: "Edit Flashcard" });
    await user.type(within(dialog).getByLabelText("Question"), " changed");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    const confirm = screen.getByRole("dialog", {
      name: "Discard your changes?",
    });
    await user.click(
      within(confirm).getByRole("button", { name: "Keep editing" }),
    );
    expect(
      (screen.getByLabelText("Question") as HTMLTextAreaElement).value,
    ).toBe("Pick a model changed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.queryByText("That’s right")).toBeNull();
    expect(screen.getByRole("button", { name: "Check answer" })).toBeTruthy();
  });

  it("rejects invalid answer data and keeps unpublished source cards hidden", () => {
    expect(() =>
      normalizeFlashcard({ ...sourceCard, options: ["Same", "Same"] }),
    ).toThrow("distinct");
    expect(() =>
      normalizeFlashcard({ ...sourceCard, correctOption: 5 }),
    ).toThrow("correct answer");
    expect(() =>
      normalizeFlashcard({
        ...sourceCard,
        cardType: "ordering",
        correctOrder: ["A tool", "A tool"],
      }),
    ).toThrow("exactly once");
    const state = {
      cards: [
        {
          sourceId: sourceCard.id,
          content: { ...sourceCard, question: "Personal wording" },
        },
      ],
      reviews: [],
    };
    expect(
      personalCatalog(shared, state).find((x) => x.id === sourceCard.id)
        ?.question,
    ).toBe("Personal wording");
    expect(
      personalCatalog([lesson, secondLesson], state).some(
        (x) => x.id === sourceCard.id,
      ),
    ).toBe(false);
    expect(sourceCard.question).toBe("Pick a model");
  });

  it("handles invalid storage and reports storage failures without claiming success", () => {
    localStorage.setItem(PERSONAL_CARDS_KEY, "broken json");
    expect(readPersonalFlashcards()).toEqual({ cards: [], reviews: [] });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(() => writePersonalFlashcards({ cards: [], reviews: [] })).toThrow(
      "could not save",
    );
  });
});
