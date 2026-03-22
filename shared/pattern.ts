export const MATERIALS = [
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "paper", label: "Paper" },
  { value: "foam", label: "Foam" },
] as const;

export type MaterialType = (typeof MATERIALS)[number]["value"];

export const MATERIAL_VALUES = MATERIALS.map((material) => material.value);

export const SEAM_ALLOWANCES: Record<MaterialType, number> = {
  fabric: 1.5,
  leather: 0.6,
  paper: 0,
  foam: 0.5,
};

export const ANGLE_LABELS = [
  "Front view",
  "Back view",
  "Left side",
  "Right side",
  "Top view",
  "Bottom view",
  "3/4 angle",
  "Detail / close-up",
] as const;

export const MAX_REFERENCE_IMAGES = 8;
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_DIMENSION_CM = 5000;
export const LAST_PATTERN_STORAGE_KEY = "patterncraft:last-pattern";

export interface PatternGrainLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PatternPiece {
  id: string;
  label: string;
  path: string;
  width: number;
  height: number;
  grainLine?: PatternGrainLine;
  notes?: string;
}

export interface AssemblyStep {
  stepNumber: number;
  piecesInvolved: string[];
  instruction: string;
}

export interface EstimatedMaterial {
  width: number;
  length: number;
  unit: string;
}

export interface PatternData {
  name: string;
  description?: string;
  pieces: PatternPiece[];
  assemblySteps?: AssemblyStep[];
  estimatedMaterial: EstimatedMaterial;
}

export interface StoredPatternDraft {
  pattern: PatternData;
  material: MaterialType;
  savedAt: string;
}

export interface UploadedReferenceImage {
  file: File;
  preview: string;
  angle: string;
}

function containsAny(text: string | undefined, patterns: RegExp[]) {
  if (!text) {
    return false;
  }

  return patterns.some((pattern) => pattern.test(text));
}

function getPieceSearchText(piece: PatternPiece) {
  return `${piece.id} ${piece.label} ${piece.notes ?? ""}`.toLowerCase();
}

function getPieceIds(pieces: PatternPiece[]) {
  return pieces.map((piece) => piece.id);
}

export function generateAssemblyStepsFallback(
  pieces: PatternPiece[],
  description?: string,
): AssemblyStep[] {
  if (!pieces.length) {
    return [];
  }

  const descriptionText = description?.toLowerCase();
  const pieceEntries = pieces.map((piece) => ({
    piece,
    text: getPieceSearchText(piece),
  }));

  const detailPieces = pieceEntries
    .filter(({ text }) =>
      containsAny(text, [/ear/, /tail/, /pocket/, /appliqu/, /face/, /eye/, /nose/, /detail/]),
    )
    .map(({ piece }) => piece.id);
  const sidePieces = pieceEntries
    .filter(({ text }) => containsAny(text, [/side/, /gusset/]))
    .map(({ piece }) => piece.id);
  const topOrBottomPieces = pieceEntries
    .filter(({ text }) => containsAny(text, [/top/, /bottom/, /base/]))
    .map(({ piece }) => piece.id);
  const panelPieces = pieceEntries
    .filter(({ text }) => containsAny(text, [/front/, /back/, /panel/, /body/]))
    .map(({ piece }) => piece.id);

  const steps: AssemblyStep[] = [
    {
      stepNumber: 1,
      piecesInvolved: getPieceIds(pieces),
      instruction:
        "Cut all pattern pieces, transfer any match points, and verify mirrored or repeated pieces before assembly.",
    },
  ];

  if (descriptionText && containsAny(descriptionText, [/embroider/, /appliqu/])) {
    steps.push({
      stepNumber: steps.length + 1,
      piecesInvolved: detailPieces.length ? detailPieces : getPieceIds(pieces).slice(0, 2),
      instruction:
        "Complete any applique, embroidery, or other surface details on the flat pieces before joining the main seams.",
    });
  } else if (detailPieces.length) {
    steps.push({
      stepNumber: steps.length + 1,
      piecesInvolved: detailPieces,
      instruction:
        "Prepare and attach the smaller detail pieces first while the main panels are still flat and easy to handle.",
    });
  }

  if (sidePieces.length && panelPieces.length) {
    steps.push({
      stepNumber: steps.length + 1,
      piecesInvolved: [...panelPieces, ...sidePieces],
      instruction:
        "Join the side or gusset pieces to the main body panels, matching seam lengths and easing corners carefully.",
    });
  }

  if (topOrBottomPieces.length) {
    steps.push({
      stepNumber: steps.length + 1,
      piecesInvolved: topOrBottomPieces,
      instruction:
        "Attach the top, bottom, or base pieces to close the remaining open edges and build the full three-dimensional shape.",
    });
  }

  steps.push({
    stepNumber: steps.length + 1,
    piecesInvolved: getPieceIds(pieces),
    instruction:
      "Sew the final closing seam with a turning or stuffing gap if needed, then turn right side out, shape the form, and close the opening securely.",
  });

  return steps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
  }));
}

export function createMockPattern(): PatternData {
  return {
    name: "Sample Object Pattern",
    description:
      "A common construction for box-like objects with a front, back, side gusset, and bottom.",
    pieces: [
      {
        id: "front",
        label: "Front Panel",
        path: "M 20 20 L 180 20 L 200 80 L 200 280 L 0 280 L 0 80 Z",
        width: 200,
        height: 260,
        grainLine: { x1: 100, y1: 40, x2: 100, y2: 260 },
      },
      {
        id: "back",
        label: "Back Panel",
        path: "M 0 0 L 200 0 L 200 260 L 0 260 Z",
        width: 200,
        height: 260,
        grainLine: { x1: 100, y1: 20, x2: 100, y2: 240 },
      },
      {
        id: "side",
        label: "Side Gusset",
        path: "M 0 0 L 60 0 L 60 260 L 0 260 Z",
        width: 60,
        height: 260,
        grainLine: { x1: 30, y1: 20, x2: 30, y2: 240 },
      },
      {
        id: "bottom",
        label: "Bottom Piece",
        path: "M 10 0 L 190 0 Q 200 0 200 10 L 200 70 Q 200 80 190 80 L 10 80 Q 0 80 0 70 L 0 10 Q 0 0 10 0 Z",
        width: 200,
        height: 80,
        grainLine: { x1: 100, y1: 10, x2: 100, y2: 70 },
      },
    ],
    assemblySteps: [
      {
        stepNumber: 1,
        piecesInvolved: ["front", "side"],
        instruction:
          "Attach the Side Gusset to the Front Panel along the vertical edges.",
      },
      {
        stepNumber: 2,
        piecesInvolved: ["back", "side"],
        instruction: "Connect the other side of the Gusset to the Back Panel.",
      },
      {
        stepNumber: 3,
        piecesInvolved: ["bottom", "front", "back", "side"],
        instruction:
          "Sew the Bottom Piece to the lower edges of all panels to close the object.",
      },
    ],
    estimatedMaterial: { width: 90, length: 120, unit: "cm" },
  };
}
