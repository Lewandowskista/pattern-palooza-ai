import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ZoomIn, ZoomOut, RotateCcw, Download, Tag, Scissors as ScissorsIcon,
  Maximize, ChevronLeft, Ruler
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PatternPiece {
  id: string;
  label: string;
  path: string;
  width: number;
  height: number;
  grainLine?: { x1: number; y1: number; x2: number; y2: number };
}

interface PatternData {
  name: string;
  pieces: PatternPiece[];
  estimatedMaterial: { width: number; length: number; unit: string };
}

const SEAM_ALLOWANCES: Record<string, number> = {
  fabric: 1.5,
  leather: 0.6,
  paper: 0,
  foam: 0.5,
};

const EditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);

  const pattern = (location.state as any)?.pattern as PatternData | undefined;
  const materialType = (location.state as any)?.material as string || "fabric";

  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrainLines, setShowGrainLines] = useState(true);
  const [seamAllowance, setSeamAllowance] = useState(true);
  const [seamWidth, setSeamWidth] = useState(SEAM_ALLOWANCES[materialType] || 1);
  const [scale, setScale] = useState(100);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern) navigate("/upload");
  }, [pattern, navigate]);

  if (!pattern) return null;

  const scaleFactor = scale / 100;

  const handleDownloadPDF = async () => {
    toast({ title: "Preparing PDF…", description: "Your pattern is being generated." });

    // Build a standalone SVG string for PDF
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // For now, download as SVG (PDF generation via edge function can be added later)
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pattern.name.replace(/\s+/g, "-").toLowerCase()}-pattern.svg`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Downloaded!", description: "Your pattern SVG has been saved." });
  };

  const handleResetView = () => {
    setZoom(1);
    setScale(100);
  };

  // Layout pieces in a grid
  const padding = 30;
  const gap = 40;
  let currentX = padding;
  let currentY = padding;
  let rowMaxH = 0;
  const maxCanvasW = 800;

  const positions = pattern.pieces.map((piece) => {
    const pw = piece.width * scaleFactor;
    const ph = piece.height * scaleFactor;

    if (currentX + pw + padding > maxCanvasW) {
      currentX = padding;
      currentY += rowMaxH + gap;
      rowMaxH = 0;
    }

    const pos = { x: currentX, y: currentY };
    currentX += pw + gap;
    rowMaxH = Math.max(rowMaxH, ph);
    return pos;
  });

  const totalH = currentY + rowMaxH + padding;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Sidebar Controls */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card/50 p-6 space-y-6 shrink-0"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate("/upload")} className="gap-1 -ml-2 mb-2">
          <ChevronLeft className="w-4 h-4" /> Back to Upload
        </Button>

        <div>
          <h2 className="font-serif text-xl font-bold mb-1">{pattern.name}</h2>
          <p className="text-sm text-muted-foreground">{pattern.pieces.length} pattern pieces</p>
        </div>

        {/* Scale */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Scale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium">{scale}%</span>
            </div>
            <Slider
              value={[scale]}
              onValueChange={([v]) => setScale(v)}
              min={50}
              max={200}
              step={5}
            />
          </CardContent>
        </Card>

        {/* Seam Allowance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScissorsIcon className="w-4 h-4" /> Seam Allowance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Show seam allowance</Label>
              <Switch checked={seamAllowance} onCheckedChange={setSeamAllowance} />
            </div>
            {seamAllowance && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Width</span>
                  <span className="font-medium">{seamWidth} cm</span>
                </div>
                <Slider
                  value={[seamWidth * 10]}
                  onValueChange={([v]) => setSeamWidth(v / 10)}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="w-4 h-4" /> Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Labels</Label>
              <Switch checked={showLabels} onCheckedChange={setShowLabels} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Grain lines</Label>
              <Switch checked={showGrainLines} onCheckedChange={setShowGrainLines} />
            </div>
          </CardContent>
        </Card>

        {/* Material Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-5">
            <p className="text-sm font-medium mb-2">Estimated Material Needed</p>
            <p className="text-2xl font-serif font-bold text-primary">
              {Math.round(pattern.estimatedMaterial.width * scaleFactor)} × {Math.round(pattern.estimatedMaterial.length * scaleFactor)} {pattern.estimatedMaterial.unit}
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{materialType}</p>
          </CardContent>
        </Card>

        <Button onClick={handleDownloadPDF} className="w-full gap-2">
          <Download className="w-4 h-4" /> Download Pattern
        </Button>
      </motion.aside>

      {/* Canvas */}
      <div className="flex-1 relative overflow-auto bg-craft-cream">
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="bg-background/80 backdrop-blur">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))} className="bg-background/80 backdrop-blur">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetView} className="bg-background/80 backdrop-blur">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-8 flex items-start justify-center min-h-full" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${maxCanvasW} ${totalH}`}
            width={maxCanvasW}
            height={totalH}
            className="bg-background rounded-xl shadow-lg border border-border"
          >
            {pattern.pieces.map((piece, i) => {
              const pos = positions[i];
              const pw = piece.width * scaleFactor;
              const ph = piece.height * scaleFactor;
              const isSelected = selectedPiece === piece.id;

              return (
                <g
                  key={piece.id}
                  transform={`translate(${pos.x}, ${pos.y}) scale(${scaleFactor})`}
                  onClick={() => setSelectedPiece(isSelected ? null : piece.id)}
                  className="cursor-pointer"
                >
                  {/* Seam allowance outline */}
                  {seamAllowance && (
                    <path
                      d={piece.path}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1}
                      strokeDasharray="6 3"
                      transform={`translate(${-seamWidth * 3}, ${-seamWidth * 3}) scale(${1 + (seamWidth * 6) / Math.min(piece.width, piece.height)})`}
                      opacity={0.4}
                    />
                  )}

                  {/* Main piece */}
                  <path
                    d={piece.path}
                    fill={isSelected ? "hsl(var(--primary) / 0.12)" : "hsl(var(--craft-linen))"}
                    stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--craft-brown))"}
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="transition-colors"
                  />

                  {/* Grain line */}
                  {showGrainLines && piece.grainLine && (
                    <g>
                      <line
                        x1={piece.grainLine.x1}
                        y1={piece.grainLine.y1}
                        x2={piece.grainLine.x2}
                        y2={piece.grainLine.y2}
                        stroke="hsl(var(--craft-warm-gray))"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                      />
                      <polygon
                        points={`${piece.grainLine.x2 - 4},${piece.grainLine.y2 - 8} ${piece.grainLine.x2 + 4},${piece.grainLine.y2 - 8} ${piece.grainLine.x2},${piece.grainLine.y2}`}
                        fill="hsl(var(--craft-warm-gray))"
                      />
                    </g>
                  )}

                  {/* Label */}
                  {showLabels && (
                    <text
                      x={piece.width / 2}
                      y={piece.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground text-[11px] font-sans font-medium pointer-events-none select-none"
                    >
                      {piece.label}
                    </text>
                  )}

                  {/* Dimensions */}
                  {showLabels && (
                    <text
                      x={piece.width / 2}
                      y={piece.height / 2 + 16}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-[9px] font-sans pointer-events-none select-none"
                    >
                      {Math.round(piece.width * scaleFactor / 10)}×{Math.round(piece.height * scaleFactor / 10)} cm
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
