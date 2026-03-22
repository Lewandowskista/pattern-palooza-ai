import { type PatternData } from "@shared/pattern";
import {
  type PatternCanvasLayout,
} from "@/lib/editor-layout";

interface ExportPatternPdfOptions {
  svgElement: SVGSVGElement;
  pattern: PatternData;
  scaleFactor: number;
  layout: PatternCanvasLayout;
}

export async function exportPatternPdf({
  svgElement,
  pattern,
  scaleFactor,
  layout,
}: ExportPatternPdfOptions) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const svgSize = svgElement.getBoundingClientRect();

  if (!ctx || !svgSize.width || !svgSize.height) {
    throw new Error("Pattern preview is not ready yet. Please try again.");
  }

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to render the pattern preview."));
      img.src = url;
    });

    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    ctx.drawImage(img, 0, 0);

    const totalWidthMM = (layout.maxCanvasWidth * scaleFactor) / 10;
    const totalHeightMM = (layout.totalHeight * scaleFactor) / 10;
    const cols = Math.max(1, Math.ceil(totalWidthMM / printableWidth));
    const rows = Math.max(1, Math.ceil(totalHeightMM / printableHeight));

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (row > 0 || col > 0) {
          doc.addPage();
        }

        doc.setFontSize(8);
        doc.text(`Tile: R${row + 1}-C${col + 1} | ${pattern.name}`, margin, margin - 2);
        doc.addImage(
          canvas,
          "PNG",
          margin - col * printableWidth,
          margin - row * printableHeight,
          totalWidthMM,
          totalHeightMM,
        );
        doc.setDrawColor(200);
        doc.line(margin, margin, margin + 5, margin);
        doc.line(margin, margin, margin, margin + 5);
      }
    }

    doc.save(`${pattern.name.replace(/\s+/g, "-").toLowerCase()}-tiled-pattern.pdf`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
