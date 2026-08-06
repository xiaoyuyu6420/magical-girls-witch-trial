import { describe, it, expect } from "vitest";
import { shuffleOptionsStable } from "./shuffle";

describe("shuffleOptionsStable", () => {
  it("is deterministic for the same key", () => {
    const opts = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const a = shuffleOptionsStable(42, opts);
    const b = shuffleOptionsStable(42, opts);
    expect(a.map((o) => o.id)).toEqual(b.map((o) => o.id));
  });

  it("does not mutate input", () => {
    const opts = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const copy = opts.map((o) => o.id);
    shuffleOptionsStable("q-1", opts);
    expect(opts.map((o) => o.id)).toEqual(copy);
  });

  it("preserves membership", () => {
    const opts = [10, 20, 30, 40, 50];
    const out = shuffleOptionsStable("abc", opts);
    expect(out.slice().sort()).toEqual(opts.slice().sort());
  });

  it("different keys can produce different orders", () => {
    const opts = [1, 2, 3, 4, 5, 6];
    const orders = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => shuffleOptionsStable(k, opts).join(",")),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});
