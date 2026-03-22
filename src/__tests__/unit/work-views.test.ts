/// <reference types="bun-types" />
import { describe, expect, test, beforeEach } from "bun:test";
import { getSavedViews, saveView, deleteView } from "@/lib/work-views";

// Bun provides a browser-like globalThis.localStorage in test environments
// via the DOM shim. If absent, stub it.
if (typeof localStorage === "undefined") {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("work-views", () => {
  test("getSavedViews returns empty array when nothing saved", () => {
    expect(getSavedViews()).toEqual([]);
  });

  test("saveView persists a view", () => {
    saveView("My View", { stage: ["new", "triaged"] });
    const views = getSavedViews();
    expect(views).toHaveLength(1);
    expect(views[0].name).toBe("My View");
    expect(views[0].filters.stage).toEqual(["new", "triaged"]);
  });

  test("deleteView removes the view", () => {
    const v = saveView("To Delete", { search: "foo" });
    expect(getSavedViews()).toHaveLength(1);
    deleteView(v.id);
    expect(getSavedViews()).toHaveLength(0);
  });

  test("multiple views are preserved", () => {
    saveView("Alpha", { type: ["task"] });
    saveView("Beta", { type: ["meeting"] });
    expect(getSavedViews()).toHaveLength(2);
  });
});
