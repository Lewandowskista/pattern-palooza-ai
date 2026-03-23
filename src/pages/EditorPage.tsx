import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  Download,
  Info,
  Maximize,
  Ruler,
  Save,
  Scissors as ScissorsIcon,
  Tag,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  SEAM_ALLOWANCES,
  type MaterialType,
  type PatternData,
} from "@shared/pattern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  calculatePatternLayout,
  EDITOR_LABEL_GAP,
  SVG_UNITS_PER_CM,
} from "@/lib/editor-layout";
import { exportPatternPdf } from "@/lib/pattern-pdf";
import { type EditorState, editorStateSchema } from "@/lib/pattern-schema";
import { loadLastPatternDraft } from "@/lib/pattern-storage";



function resolveEditorPattern(state: unknown): { pattern: PatternData; material: MaterialType } | null {
  const parsedState = editorStateSchema.safeParse(state) as
    | { success: true; data: EditorState }
    | { success: false };

  if (parsedState.success) {
    return {
      pattern: parsedState.data.pattern as PatternData,
      material: parsedState.data.material,
    };
  }

  const storedDraft = loadLastPatternDraft();

  if (!storedDraft) {
    return null;
  }

  const parsedStoredDraft = editorStateSchema.safeParse(storedDraft) as
    | { success: true; data: EditorState }
    | { success: false };

  return parsedStoredDraft.success
    ? {
        pattern: parsedStoredDraft.data.pattern as PatternData,
        material: parsedStoredDraft.data.material,
      }
    : null;
}

const EditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);

  const resolvedState = useMemo(() => resolveEditorPattern(location.state), [location.state]);

  const pattern = resolvedState?.pattern ?? null;
  const materialType = resolvedState?.material ?? "fabric";

  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showGrainLines, setShowGrainLines] = useState(true);
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const [seamWidth, setSeamWidth] = useState(SEAM_ALLOWANCES[materialType] ?? 1);
  const [scale, setScale] = useState(100);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [highlightedPieces, setHighlightedPieces] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const savedPatternId = (location.state as any)?.savedPatternId as string | undefined;

  useEffect(() => {
    setSeamWidth(SEAM_ALLOWANCES[materialType] ?? 1);
  }, [materialType]);

  const scaleFactor = scale / 100;
  const seamAllowanceUnits = seamWidth * SVG_UNITS_PER_CM;
  const layout = useMemo(
    () =>
      pattern
        ? calculatePatternLayout(pattern, scaleFactor, {
            seamAllowanceCm: showSeamAllowance ? seamWidth : 0,
            includeLabels: showLabels,
          })
        : null,
    [pattern, scaleFactor, seamWidth, showLabels, showSeamAllowance],
  );

  const handleDownloadPDF = async () => {
    if (!pattern || !layout || !svgRef.current) {
      return;
    }

    setIsExporting(true);
    toast({
      title: "Generating PDF tiles...",
      description: "Calculating print layout for real-world scale.",
    });

    try {
      await exportPatternPdf({
        svgElement: svgRef.current,
        pattern,
        scaleFactor,
        layout,
      });
      toast({
        title: "PDF Ready",
        description: "Your tiled pattern has been saved.",
      });
    } catch (error) {
      console.error("PDF export failed", error);
      toast({
        title: "Export failed",
        description:
          error instanceof Error
            ? error.message
            : "We could not export this pattern right now.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetView = () => {
    setZoom(1);
    setScale(100);
  };

  if (!pattern || !layout) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">No pattern loaded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a pattern first, or reopen the most recently saved one from the
              upload flow.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate("/upload")}>Go to Upload</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry Recovery
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full shrink-0 space-y-6 border-b border-border bg-card/50 p-6 lg:w-80 lg:border-b-0 lg:border-r"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/upload")}
          className="-ml-2 mb-2 gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Upload
        </Button>

        <div>
          <h2 className="mb-1 font-serif text-xl font-bold">{pattern.name}</h2>
          <p className="text-sm text-muted-foreground">
            {pattern.pieces.length} pattern pieces
          </p>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="settings" className="gap-2">
              <Info className="h-4 w-4" /> Tools
            </TabsTrigger>
            <TabsTrigger value="guide" className="gap-2">
              <BookOpen className="h-4 w-4" /> Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader className="px-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4" /> Scale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span className="font-medium">{scale}%</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([value]) => setScale(value)}
                  min={50}
                  max={200}
                  step={5}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ScissorsIcon className="h-4 w-4" /> Seam Allowance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show seam allowance</Label>
                  <Switch checked={showSeamAllowance} onCheckedChange={setShowSeamAllowance} />
                </div>
                {showSeamAllowance ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Width</span>
                      <span className="font-medium">{seamWidth.toFixed(1)} cm</span>
                    </div>
                    <Slider
                      value={[seamWidth * 10]}
                      onValueChange={([value]) => setSeamWidth(value / 10)}
                      min={0}
                      max={30}
                      step={1}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" /> Display
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
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

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="px-4 pb-4 pt-5">
                <p className="mb-2 text-sm font-medium">Estimated Material Needed</p>
                <p className="font-serif text-2xl font-bold text-primary">
                  {Math.round(pattern.estimatedMaterial.width * scaleFactor)} x{" "}
                  {Math.round(pattern.estimatedMaterial.length * scaleFactor)}{" "}
                  {pattern.estimatedMaterial.unit}
                </p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">{materialType}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guide">
            <ScrollArea className="h-[400px] pr-4 lg:h-[500px]">
              <div className="space-y-4">
                {pattern.description ? (
                  <p className="mb-4 text-sm italic text-muted-foreground">
                    "{pattern.description}"
                  </p>
                ) : null}
                {pattern.assemblySteps?.length ? (
                  pattern.assemblySteps.map((step) => (
                    <motion.div
                      key={step.stepNumber}
                      whileHover={{ x: 4 }}
                      onMouseEnter={() => setHighlightedPieces(step.piecesInvolved)}
                      onMouseLeave={() => setHighlightedPieces([])}
                      className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50"
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {step.stepNumber}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          Step {step.stepNumber}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.instruction}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No assembly steps were generated for this pattern.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {user && (
          <Button
            onClick={async () => {
              if (!pattern) return;
              setIsSaving(true);
              try {
                const patternRecord = {
                  user_id: user.id,
                  name: pattern.name,
                  description: pattern.description || null,
                  material: materialType,
                  pattern_data: pattern as any,
                  updated_at: new Date().toISOString(),
                };

                if (savedPatternId) {
                  const { error } = await supabase
                    .from("saved_patterns")
                    .update(patternRecord)
                    .eq("id", savedPatternId);
                  if (error) throw error;
                } else {
                  const { error } = await supabase
                    .from("saved_patterns")
                    .insert(patternRecord);
                  if (error) throw error;
                }

                toast({ title: "Pattern saved!" });
              } catch (err: any) {
                toast({
                  title: "Save failed",
                  description: err?.message || "Could not save pattern.",
                  variant: "destructive",
                });
              } finally {
                setIsSaving(false);
              }
            }}
            variant="outline"
            className="w-full gap-2"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Pattern"}
          </Button>
        )}

        <Button
          onClick={handleDownloadPDF}
          className="w-full gap-2"
          disabled={isExporting}
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Preparing PDF..." : "Download Tiled PDF"}
        </Button>
      </motion.aside>

      <div className="relative flex-1 overflow-auto bg-craft-cream">
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((previous) => Math.min(previous + 0.25, 3))}
            className="bg-background/80 backdrop-blur"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((previous) => Math.max(previous - 0.25, 0.25))}
            className="bg-background/80 backdrop-blur"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleResetView}
            className="bg-background/80 backdrop-blur"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        <div
          className="flex min-h-full items-start justify-center p-8"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${layout.maxCanvasWidth} ${layout.totalHeight}`}
            width={layout.maxCanvasWidth}
            height={layout.totalHeight}
            className="rounded-xl border border-border bg-background shadow-lg"
          >
            {pattern.pieces.map((piece, index) => {
              const position = layout.positions[index];
              const isSelected = selectedPiece === piece.id;

              return (
                <g
                  key={piece.id}
                  transform={`translate(${position.x}, ${position.y}) scale(${scaleFactor})`}
                  onClick={() => setSelectedPiece(isSelected ? null : piece.id)}
                  className="cursor-pointer"
                >
                  {showSeamAllowance ? (
                    <path
                      d={piece.path}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={Math.max(seamAllowanceUnits * 2, 2)}
                      strokeDasharray={`${Math.max(seamAllowanceUnits * 0.9, 6)} ${Math.max(seamAllowanceUnits * 0.45, 4)}`}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={0.18}
                    />
                  ) : null}

                  <path
                    d={piece.path}
                    fill={isSelected ? "hsl(var(--primary) / 0.12)" : "hsl(var(--craft-linen))"}
                    stroke={
                      highlightedPieces.includes(piece.id) || isSelected
                        ? "hsl(var(--primary))"
                        : "hsl(var(--craft-brown))"
                    }
                    strokeWidth={highlightedPieces.includes(piece.id) ? 3 : isSelected ? 2 : 1.5}
                    className="transition-all duration-300"
                  />

                  {showGrainLines && piece.grainLine ? (
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
                  ) : null}

                  {showLabels ? (
                    <>
                      <rect
                        x={Math.max(piece.width / 2 - 62, -seamAllowanceUnits)}
                        y={piece.height + seamAllowanceUnits + EDITOR_LABEL_GAP}
                        width={124}
                        height={28}
                        rx={10}
                        fill="hsl(var(--background) / 0.92)"
                        stroke="hsl(var(--border))"
                        strokeWidth={1}
                      />
                      <text
                        x={piece.width / 2}
                        y={piece.height + seamAllowanceUnits + EDITOR_LABEL_GAP + 10}
                        textAnchor="middle"
                        dominantBaseline="hanging"
                        className="pointer-events-none select-none fill-foreground text-[11px] font-medium"
                      >
                        {piece.label}
                      </text>
                      <text
                        x={piece.width / 2}
                        y={piece.height + seamAllowanceUnits + EDITOR_LABEL_GAP + 22}
                        textAnchor="middle"
                        dominantBaseline="hanging"
                        className="pointer-events-none select-none fill-muted-foreground text-[9px]"
                      >
                        {Math.round((piece.width * scaleFactor) / 10)}x
                        {Math.round((piece.height * scaleFactor) / 10)} cm
                      </text>
                    </>
                  ) : null}
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
