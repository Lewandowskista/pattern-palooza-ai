import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, X, Ruler, Layers, Plus, Camera } from "lucide-react";
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

const angleLabels = [
  "Front view",
  "Back view",
  "Left side",
  "Right side",
  "Top view",
  "Bottom view",
  "3/4 angle",
  "Detail / close-up",
];

interface UploadedImage {
  file: File;
  preview: string;
  angle: string;
}

const UploadPage = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [material, setMaterial] = useState("fabric");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const addFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (images.length >= 8) {
      toast({ title: "Maximum reached", description: "You can upload up to 8 reference images.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const defaultAngle = angleLabels[images.length] || "Front view";
      setImages(prev => [...prev, { file: f, preview: e.target?.result as string, angle: defaultAngle }]);
    };
    reader.readAsDataURL(f);
  }, [toast, images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => addFile(f));
  }, [addFile]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateAngle = (index: number, angle: string) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, angle } : img));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleGenerate = async () => {
    if (images.length === 0) {
      toast({ title: "No images", description: "Please upload at least one image.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);

    try {
      const imageData = await Promise.all(
        images.map(async (img) => ({
          base64: await fileToBase64(img.file),
          angle: img.angle,
        }))
      );

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
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
          images: imageData,
          width: width ? parseFloat(width) : undefined,
          height: height ? parseFloat(height) : undefined,
          depth: depth ? parseFloat(depth) : undefined,
          material,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate pattern");
      }

      const patternData = await response.json();
      navigate("/editor", { state: { pattern: patternData, material } });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Generation failed", description: err.message || "Something went wrong. Using demo pattern.", variant: "destructive" });
      const mockPattern = generateMockPattern();
      navigate("/editor", { state: { pattern: mockPattern, material } });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">Upload Your Object</h1>
        <p className="text-muted-foreground mb-8">
          Add photos from multiple angles for the most accurate pattern. The more views you provide, the better the result.
        </p>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded-xl border border-border bg-card overflow-hidden">
              <img src={img.preview} alt={img.angle} className="w-full h-36 object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="p-2">
                <Select value={img.angle} onValueChange={(v) => updateAngle(i, v)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {angleLabels.map((a) => (
                      <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {/* Add more button */}
          {images.length < 8 && (
            <div
              className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[12rem] ${
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-craft-linen"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) Array.from(e.target.files).forEach(addFile);
                  e.target.value = "";
                }}
              />
              {images.length === 0 ? (
                <>
                  <Upload className="w-8 h-8 text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground text-center px-2">Drop images or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 8 photos</p>
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6 text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Add more</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Angle tips */}
        {images.length > 0 && images.length < 3 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
            <Camera className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Tip: Add more angles for better accuracy</p>
              <p className="text-muted-foreground mt-0.5">
                Front + back + side views help the AI understand the full 3D shape and create more precise pattern pieces.
              </p>
            </div>
          </div>
        )}

        {/* Object description */}
        <div className="space-y-2 mb-6">
          <Label className="text-sm">Object description (optional)</Label>
          <Input
            placeholder="e.g. A structured leather tote bag with a flat bottom and two handles"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">Describe the object, its construction, or any details the AI should know about</p>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="w-4 h-4 text-muted-foreground" /> Width (cm)
            </Label>
            <Input type="number" placeholder="Optional" value={width} onChange={(e) => setWidth(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="w-4 h-4 text-muted-foreground" /> Height (cm)
            </Label>
            <Input type="number" placeholder="Optional" value={height} onChange={(e) => setHeight(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="w-4 h-4 text-muted-foreground" /> Depth (cm)
            </Label>
            <Input type="number" placeholder="Optional" value={depth} onChange={(e) => setDepth(e.target.value)} className="bg-background" />
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
          disabled={images.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Analyzing {images.length} {images.length === 1 ? "image" : "images"}…
            </span>
          ) : (
            `Generate Pattern from ${images.length || "0"} ${images.length === 1 ? "image" : "images"}`
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
      { id: "front", label: "Front Panel", path: "M 20 20 L 180 20 L 200 80 L 200 280 L 0 280 L 0 80 Z", width: 200, height: 260, grainLine: { x1: 100, y1: 40, x2: 100, y2: 260 } },
      { id: "back", label: "Back Panel", path: "M 0 0 L 200 0 L 200 260 L 0 260 Z", width: 200, height: 260, grainLine: { x1: 100, y1: 20, x2: 100, y2: 240 } },
      { id: "side", label: "Side Gusset", path: "M 0 0 L 60 0 L 60 260 L 0 260 Z", width: 60, height: 260, grainLine: { x1: 30, y1: 20, x2: 30, y2: 240 } },
      { id: "bottom", label: "Bottom Piece", path: "M 10 0 L 190 0 Q 200 0 200 10 L 200 70 Q 200 80 190 80 L 10 80 Q 0 80 0 70 L 0 10 Q 0 0 10 0 Z", width: 200, height: 80, grainLine: { x1: 100, y1: 10, x2: 100, y2: 70 } },
    ],
    estimatedMaterial: { width: 90, length: 120, unit: "cm" },
  };
}

export default UploadPage;
