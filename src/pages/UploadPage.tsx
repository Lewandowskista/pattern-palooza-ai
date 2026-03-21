import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, X, Ruler, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const materials = [
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "paper", label: "Paper" },
  { value: "foam", label: "Foam" },
];

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [material, setMaterial] = useState("fabric");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!file) {
      toast({ title: "No image", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          // Demo mode — generate mock pattern data
          const mockPattern = generateMockPattern();
          navigate("/editor", { state: { pattern: mockPattern, material } });
          return;
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/generate-pattern`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            image: base64,
            width: width ? parseFloat(width) : undefined,
            height: height ? parseFloat(height) : undefined,
            material,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate pattern");
        }

        const patternData = await response.json();
        navigate("/editor", { state: { pattern: patternData, material } });
      } catch (err) {
        console.error(err);
        // Fallback to mock
        const mockPattern = generateMockPattern();
        navigate("/editor", { state: { pattern: mockPattern, material } });
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Upload Your Object</h1>
        <p className="text-muted-foreground mb-8">
          Take a photo of the object you want to create a pattern for
        </p>

        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer mb-8 ${
            isDragOver
              ? "border-primary bg-primary/5"
              : preview
              ? "border-border bg-card"
              : "border-border hover:border-primary/50 bg-craft-linen"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !preview && document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Preview" className="max-h-72 rounded-xl mx-auto shadow-md" />
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                {isDragOver ? (
                  <ImageIcon className="w-8 h-8 text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-primary" />
                )}
              </div>
              <p className="font-medium text-foreground">
                {isDragOver ? "Drop your image here" : "Drag & drop an image, or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 20MB</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="w-4 h-4 text-muted-foreground" /> Width (cm)
            </Label>
            <Input
              type="number"
              placeholder="Optional"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="w-4 h-4 text-muted-foreground" /> Height (cm)
            </Label>
            <Input
              type="number"
              placeholder="Optional"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4 text-muted-foreground" /> Material
            </Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate */}
        <Button
          size="lg"
          className="w-full py-6 text-base rounded-xl"
          onClick={handleGenerate}
          disabled={!file || isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analyzing your object…
            </span>
          ) : (
            "Generate Pattern"
          )}
        </Button>
      </motion.div>
    </div>
  );
};

function generateMockPattern() {
  return {
    name: "Sample Object Pattern",
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
    estimatedMaterial: { width: 90, length: 120, unit: "cm" },
  };
}

export default UploadPage;
