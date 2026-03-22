import { z } from "zod";
import {
  type AssemblyStep,
  generateAssemblyStepsFallback,
  MATERIAL_VALUES,
  MAX_DIMENSION_CM,
  type MaterialType,
  type PatternData,
  type PatternGrainLine,
  type PatternPiece,
} from "@shared/pattern";

const finiteNumber = z.number().finite();

export const materialSchema = z.enum(MATERIAL_VALUES as [MaterialType, ...MaterialType[]]);

export const grainLineSchema = z.object({
  x1: finiteNumber,
  y1: finiteNumber,
  x2: finiteNumber,
  y2: finiteNumber,
});

export const patternPieceSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  path: z.string().trim().min(1),
  width: finiteNumber.positive().max(MAX_DIMENSION_CM),
  height: finiteNumber.positive().max(MAX_DIMENSION_CM),
  grainLine: grainLineSchema.optional(),
  notes: z.string().trim().min(1).optional(),
});

export const assemblyStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  piecesInvolved: z.array(z.string().trim().min(1)).default([]),
  instruction: z.string().trim().min(1),
});

export const estimatedMaterialSchema = z.object({
  width: finiteNumber.nonnegative().max(MAX_DIMENSION_CM),
  length: finiteNumber.nonnegative().max(MAX_DIMENSION_CM),
  unit: z.string().trim().min(1),
});

export const patternDataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  pieces: z.array(patternPieceSchema).min(1),
  assemblySteps: z.array(assemblyStepSchema).optional(),
  estimatedMaterial: estimatedMaterialSchema,
});

export const editorStateSchema = z.object({
  pattern: patternDataSchema,
  material: materialSchema.default("fabric"),
});

export type EditorState = z.infer<typeof editorStateSchema>;

export function sanitizePatternData(input: unknown): PatternData {
  const parsed = patternDataSchema.parse(input);
  const normalizedDescription = parsed.description?.trim();
  const normalizedPieces: PatternPiece[] = parsed.pieces.map((piece) => {
    const grainLine = piece.grainLine
      ? ({
          x1: piece.grainLine.x1,
          y1: piece.grainLine.y1,
          x2: piece.grainLine.x2,
          y2: piece.grainLine.y2,
        } satisfies PatternGrainLine)
      : ({
          x1: piece.width / 2,
          y1: 20,
          x2: piece.width / 2,
          y2: Math.max(piece.height - 20, 20),
        } satisfies PatternGrainLine);

    return {
      id: piece.id.trim(),
      label: piece.label.trim(),
      path: normalizeSvgPath(piece.path),
      width: piece.width,
      height: piece.height,
      grainLine,
      notes: piece.notes?.trim(),
    };
  });
  const normalizedAssemblySteps: AssemblyStep[] =
    parsed.assemblySteps?.length
      ? parsed.assemblySteps.map((step, index) => ({
          ...step,
          stepNumber: index + 1,
          piecesInvolved: step.piecesInvolved.map((pieceId) => pieceId.trim()),
          instruction: step.instruction.trim(),
        }))
      : generateAssemblyStepsFallback(normalizedPieces, normalizedDescription);

  return {
    name: parsed.name.trim(),
    description: normalizedDescription,
    pieces: normalizedPieces,
    assemblySteps: normalizedAssemblySteps,
    estimatedMaterial: {
      width: parsed.estimatedMaterial.width,
      length: parsed.estimatedMaterial.length,
      unit: parsed.estimatedMaterial.unit.trim(),
    },
  };
}

export function normalizeSvgPath(path: string) {
  const compactPath = path.replace(/\s+/g, " ").trim();

  if (!compactPath) {
    return "M 0 0 L 1 0 L 1 1 L 0 1 Z";
  }

  const withoutUnsafeChars = compactPath.replace(/[^MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]/g, " ");
  const normalized = withoutUnsafeChars.replace(/\s+/g, " ").trim();

  return /[Zz]$/.test(normalized) ? normalized : `${normalized} Z`;
}
