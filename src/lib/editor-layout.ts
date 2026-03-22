import { type PatternData } from "@shared/pattern";

export const SVG_UNITS_PER_CM = 10;
export const EDITOR_CANVAS_PADDING = 36;
export const EDITOR_CANVAS_GAP = 28;
export const EDITOR_MAX_CANVAS_WIDTH = 980;
export const EDITOR_PIECE_MIN_WIDTH = 170;
export const EDITOR_LABEL_GAP = 14;
export const EDITOR_LABEL_HEIGHT = 34;
export const EDITOR_PIECE_PADDING = 18;

export interface PatternPiecePosition {
  x: number;
  y: number;
}

export interface PatternCanvasLayout {
  positions: PatternPiecePosition[];
  totalHeight: number;
  maxCanvasWidth: number;
}

interface CalculatePatternLayoutOptions {
  seamAllowanceCm?: number;
  includeLabels?: boolean;
}

export function calculatePatternLayout(
  pattern: PatternData,
  scaleFactor: number,
  {
    seamAllowanceCm = 0,
    includeLabels = true,
  }: CalculatePatternLayoutOptions = {},
): PatternCanvasLayout {
  let currentX = EDITOR_CANVAS_PADDING;
  let currentY = EDITOR_CANVAS_PADDING;
  let rowMaxHeight = 0;
  const seamAllowancePadding = seamAllowanceCm * SVG_UNITS_PER_CM * scaleFactor;
  const labelReserve = includeLabels ? EDITOR_LABEL_GAP + EDITOR_LABEL_HEIGHT : 0;

  const positions = pattern.pieces.map((piece) => {
    const pieceWidth = piece.width * scaleFactor;
    const pieceHeight = piece.height * scaleFactor;
    const footprintWidth = Math.max(
      pieceWidth + seamAllowancePadding * 2 + EDITOR_PIECE_PADDING * 2,
      EDITOR_PIECE_MIN_WIDTH,
    );
    const footprintHeight =
      pieceHeight +
      seamAllowancePadding * 2 +
      EDITOR_PIECE_PADDING * 2 +
      labelReserve;

    if (currentX + footprintWidth + EDITOR_CANVAS_PADDING > EDITOR_MAX_CANVAS_WIDTH) {
      currentX = EDITOR_CANVAS_PADDING;
      currentY += rowMaxHeight + EDITOR_CANVAS_GAP;
      rowMaxHeight = 0;
    }

    const position = {
      x:
        currentX +
        (footprintWidth - pieceWidth) / 2,
      y: currentY + seamAllowancePadding + EDITOR_PIECE_PADDING,
    };

    currentX += footprintWidth + EDITOR_CANVAS_GAP;
    rowMaxHeight = Math.max(rowMaxHeight, footprintHeight);

    return position;
  });

  return {
    positions,
    totalHeight: currentY + rowMaxHeight + EDITOR_CANVAS_PADDING,
    maxCanvasWidth: EDITOR_MAX_CANVAS_WIDTH,
  };
}
