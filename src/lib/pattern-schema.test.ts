import { describe, expect, it } from "vitest";
import { sanitizePatternData } from "@/lib/pattern-schema";

describe("sanitizePatternData", () => {
  it("closes SVG paths and adds default grain lines", () => {
    const result = sanitizePatternData({
      name: " Tote Bag ",
      pieces: [
        {
          id: "front",
          label: "Front Panel",
          path: "M 0 0 L 10 0 L 10 20 L 0 20",
          width: 10,
          height: 20,
        },
      ],
      estimatedMaterial: {
        width: 20,
        length: 30,
        unit: "cm",
      },
    });

    expect(result.name).toBe("Tote Bag");
    expect(result.pieces[0].path.endsWith("Z")).toBe(true);
    expect(result.pieces[0].grainLine).toEqual({
      x1: 5,
      y1: 20,
      x2: 5,
      y2: 20,
    });
  });

  it("rejects malformed payloads", () => {
    expect(() =>
      sanitizePatternData({
        name: "Broken",
        pieces: [],
        estimatedMaterial: { width: 1, length: 2, unit: "cm" },
      }),
    ).toThrow();
  });

  it("generates fallback assembly steps when the payload omits them", () => {
    const result = sanitizePatternData({
      name: "Plush Cat Cube",
      description:
        "A six-panel cube plushie with applique and embroidered cat features. Ears are 3D and sewn into the top seam.",
      pieces: [
        {
          id: "front",
          label: "Front Panel",
          path: "M 0 0 L 10 0 L 10 10 L 0 10",
          width: 10,
          height: 10,
        },
        {
          id: "top",
          label: "Top Panel",
          path: "M 0 0 L 10 0 L 10 10 L 0 10",
          width: 10,
          height: 10,
        },
        {
          id: "ear_left",
          label: "Left Ear",
          path: "M 0 0 L 5 0 L 2.5 5",
          width: 5,
          height: 5,
        },
      ],
      estimatedMaterial: {
        width: 20,
        length: 30,
        unit: "cm",
      },
    });

    expect(result.assemblySteps?.length).toBeGreaterThan(0);
    expect(result.assemblySteps?.[1]?.instruction.toLowerCase()).toContain("applique");
    expect(result.assemblySteps?.some((step) => step.piecesInvolved.includes("top"))).toBe(true);
  });
});
