// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { AppProvider, useApp } from "./AppContext";
import { api, session, enterDemo } from "../lib/api";
import {
  GUEST_STORAGE_KEY,
  newGuestState,
  readGuest,
  writeGuest,
} from "../lib/guest";
import type { Content } from "../lib/types";

vi.mock("../lib/api", () => ({
  api: vi.fn(),
  session: vi.fn(),
  enterDemo: vi.fn(),
  message: (e: Error) => e.message,
}));
const catalog = [{ id: "track-ai", kind: "TRACK" }] as Content[];
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(session).mockResolvedValue({
    role: "ANONYMOUS",
    csrfToken: "test",
    demo: false,
  });
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/catalog") return catalog as never;
    throw new Error(`Unexpected protected API call: ${path}`);
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("hosted guest study flow", () => {
  it("loads public content, keeps study actions in this browser, and restores them on reload", async () => {
    const first = renderHook(useApp, { wrapper });
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.error).toBe("");
    expect(first.result.current.catalog).toEqual(catalog);
    await act(async () => {
      await first.result.current.setPreferences({
        ...first.result.current.preferences,
        name: "Sam",
        onboarded: true,
      });
      await first.result.current.complete("models-1", true);
      await first.result.current.review("card-concept", 3);
    });
    await act(async () => {
      await first.result.current.save("models-1");
    });
    first.unmount();
    const restored = renderHook(useApp, { wrapper });
    await waitFor(() => expect(restored.result.current.loading).toBe(false));
    expect(restored.result.current.preferences).toMatchObject({
      name: "Sam",
      onboarded: true,
      saved: ["models-1"],
    });
    expect(restored.result.current.progress.completed).toEqual(["models-1"]);
    expect(restored.result.current.progress.reviews[0]).toMatchObject({
      cardId: "card-concept",
      rating: 3,
      repetitions: 1,
    });
    expect(
      Date.parse(restored.result.current.progress.reviews[0].dueAt),
    ).toBeGreaterThan(Date.now());
    expect(
      vi.mocked(api).mock.calls.every(([path]) => path === "/catalog"),
    ).toBe(true);
    await expect(restored.result.current.switchRole("ADMIN")).rejects.toThrow(
      "local development",
    );
    expect(enterDemo).not.toHaveBeenCalled();
  });

  it("does not report a successful completion when browser storage is blocked", async () => {
    const { result } = renderHook(useApp, { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    await act(async () => {
      await expect(result.current.complete("models-1", true)).rejects.toThrow(
        "could not save",
      );
    });
    expect(result.current.progress.completed).toEqual([]);
  });

  it("continues using the server for authenticated local demo sessions", async () => {
    const server = newGuestState();
    server.preferences.name = "Server learner";
    const guest = newGuestState();
    guest.preferences.name = "Browser learner";
    writeGuest(guest);
    vi.mocked(session).mockResolvedValue({
      role: "LEARNER",
      csrfToken: "test",
      demo: true,
    });
    vi.mocked(api).mockImplementation(async (path) => {
      if (path === "/catalog") return catalog as never;
      if (path === "/preferences") return server.preferences as never;
      if (path === "/progress") return server.progress as never;
      throw new Error(path);
    });
    const { result } = renderHook(useApp, { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.guest).toBe(false);
    expect(result.current.preferences.name).toBe("Server learner");
    expect(readGuest().preferences.name).toBe("Browser learner");
  });

  it("recovers from corrupt, outdated, or invalid browser data", () => {
    for (const data of [
      "invalid json",
      JSON.stringify({ version: 0, ...newGuestState() }),
      JSON.stringify({
        version: 1,
        preferences: newGuestState().preferences,
        progress: {
          completed: [],
          reviews: [{ cardId: "card", dueAt: "invalid" }],
        },
      }),
    ]) {
      localStorage.setItem(GUEST_STORAGE_KEY, data);
      expect(readGuest()).toEqual(newGuestState());
    }
  });
});
