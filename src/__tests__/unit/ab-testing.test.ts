import { describe, expect, test } from "bun:test";
import { getExperiments } from "@/lib/ab-testing";

describe("A/B testing", () => {
  test("returns defined experiments", () => {
    const experiments = getExperiments();
    expect(Array.isArray(experiments)).toBe(true);
    expect(experiments.length).toBeGreaterThan(0);
  });

  test("each experiment has id, variants, and weights", () => {
    for (const exp of getExperiments()) {
      expect(typeof exp.id).toBe("string");
      expect(Array.isArray(exp.variants)).toBe(true);
      expect(exp.variants.length).toBeGreaterThanOrEqual(2);
      if (exp.weights) {
        expect(exp.weights.length).toBe(exp.variants.length);
        const total = exp.weights.reduce((a, b) => a + b, 0);
        expect(Math.abs(total - 1)).toBeLessThan(0.001);
      }
    }
  });
});
