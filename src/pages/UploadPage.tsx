import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Layers, Plus, Ruler, Upload, X } from "lucide-react";
import {
  createMockPattern,
  ANGLE_LABELS,
  MATERIALS,
  MATERIAL_VALUES,
  MAX_DIMENSION_CM,
  MAX_FILE_SIZE_BYTES,
  MAX_REFERENCE_IMAGES,
  type MaterialType,
  type UploadedReferenceImage,
} from "@shared/pattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generatePattern } from "@/lib/pattern-generation";
import { saveLastPatternDraft } from "@/lib/pattern-storage";

interface FormErrors {
  images?: string;
  dimensions?: string;
  material?: string;
  submit?: string;
}

const emptyErrors: FormErrors = {};

const UploadPage = () => {
  const [images, setImages] = useState<UploadedReferenceImage[]>([]);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [depth, setDepth] = useState("");
  const [material, setMaterial] = useState<MaterialType>("fabric");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedCountLabel = useMemo(
    () => `${images.length} ${images.length === 1 ? "image" : "images"}`,
    [images.length],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const nextErrors: FormErrors = {};
      const nextImages: UploadedReferenceImage[] = [];
      const remainingSlots = MAX_REFERENCE_IMAGES - images.length;

      if (files.length > remainingSlots) {
        nextErrors.images = `You can upload up to ${MAX_REFERENCE_IMAGES} reference images.`;
      }

      files.slice(0, remainingSlots).forEach((file, index) => {
        if (!file.type.startsWith("image/")) {
          nextErrors.images = "Only image files are supported.";
          return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          nextErrors.images = `Each image must be smaller than ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} MB.`;
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = typeof event.target?.result === "string" ? event.target.result : "";

          setImages((previous) => [
            ...previous,
            {
              file,
              preview,
              angle: ANGLE_LABELS[previous.length + index] ?? "Front view",
            },
          ]);
        };
        reader.readAsDataURL(file);
      });

      setErrors((previous) => ({ ...previous, ...nextErrors, submit: undefined }));
      void nextImages;
    },
    [images.length],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      addFiles(Array.from(event.dataTransfer.files));
    },
    [addFiles],
  );

  const removeImage = (index: number) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    setErrors((previous) => ({ ...previous, images: undefined, submit: undefined }));
  };

  const updateAngle = (index: number, angle: string) => {
    setImages((previous) =>
      previous.map((image, imageIndex) =>
        imageIndex === index ? { ...image, angle } : image,
      ),
    );
  };

  const parseDimension = (value: string) => {
    if (!value.trim()) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : Number.NaN;
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const parsedDimensions = [parseDimension(width), parseDimension(height), parseDimension(depth)];

    if (images.length === 0) {
      nextErrors.images = "Add at least one reference image before generating a pattern.";
    }

    if (!MATERIAL_VALUES.includes(material)) {
      nextErrors.material = "Choose a supported material before continuing.";
    }

    if (
      parsedDimensions.some(
        (value) =>
          value !== undefined &&
          (!Number.isFinite(value) || value <= 0 || value > MAX_DIMENSION_CM),
      )
    ) {
      nextErrors.dimensions = `Dimensions must be numbers between 0 and ${MAX_DIMENSION_CM} cm.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setErrors(emptyErrors);

    try {
      const result = await generatePattern({
        images,
        width: parseDimension(width),
        height: parseDimension(height),
        depth: parseDimension(depth),
        material,
        description: description.trim(),
      });

      saveLastPatternDraft({
        pattern: result.pattern,
        material,
        savedAt: new Date().toISOString(),
      });

      if (result.usedFallback) {
        toast({
          title: "Using demo pattern",
          description:
            "Live generation is unavailable right now, so we loaded a sample pattern instead.",
        });
      }

      navigate("/editor", {
        state: {
          pattern: result.pattern,
          material,
        },
      });
    } catch (error) {
      console.error("Pattern generation failed", error);
      const fallbackPattern = createMockPattern();
      saveLastPatternDraft({
        pattern: fallbackPattern,
        material,
        savedAt: new Date().toISOString(),
      });
      toast({
        title: "Generation failed, using demo pattern",
        description:
          error instanceof Error
            ? error.message
            : "We could not validate the generated pattern.",
        variant: "destructive",
      });
      navigate("/editor", {
        state: {
          pattern: fallbackPattern,
          material,
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-2 font-serif text-3xl font-bold md:text-4xl">Upload Your Object</h1>
        <p className="mb-8 text-muted-foreground">
          Add one or more photos of your object. The AI will generate the full set
          of panels needed to build it, and extra angles improve accuracy.
        </p>

        <div className="mb-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={`${image.file.name}-${index}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <img
                src={image.preview}
                alt={image.angle}
                className="h-36 w-full object-cover"
              />
              <button
                type="button"
                aria-label={`Remove ${image.file.name}`}
                onClick={() => removeImage(index)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-md transition-opacity hover:scale-110 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="p-2">
                <Select value={image.angle} onValueChange={(value) => updateAngle(index, value)}>
                  <SelectTrigger className="h-8 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANGLE_LABELS.map((angleLabel) => (
                      <SelectItem key={angleLabel} value={angleLabel} className="text-xs">
                        {angleLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          {images.length < MAX_REFERENCE_IMAGES && (
            <div
              className={`relative flex min-h-[12rem] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border bg-craft-linen hover:border-primary/50"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
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
                onChange={(event) => {
                  if (event.target.files) {
                    addFiles(Array.from(event.target.files));
                  }
                  event.target.value = "";
                }}
              />
              {images.length === 0 ? (
                <>
                  <Upload className="mb-2 h-8 w-8 text-primary" />
                  <p className="px-2 text-center text-sm font-medium text-foreground">
                    Drop images or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, or WEBP up to 20 MB each
                  </p>
                </>
              ) : (
                <>
                  <Plus className="mb-1 h-6 w-6 text-primary" />
                  <p className="text-xs text-muted-foreground">Add more</p>
                </>
              )}
            </div>
          )}
        </div>

        <p className="mb-6 text-xs text-muted-foreground">
          Selected: {selectedCountLabel}. You can upload up to {MAX_REFERENCE_IMAGES} photos.
        </p>

        {errors.images ? (
          <p role="alert" className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.images}
          </p>
        ) : null}

        {images.length > 0 && images.length < 3 ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Tip: Add more angles for better accuracy</p>
              <p className="mt-0.5 text-muted-foreground">
                Front + back + side views help the AI understand the full 3D shape
                and estimate the complete panel set more precisely.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mb-6 space-y-2">
          <Label className="text-sm">Object description</Label>
          <Textarea
            placeholder="Describe the object, its construction, and anything the AI should preserve."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-[100px] bg-background"
          />
          <p className="text-xs text-muted-foreground">
            Include details like structure, closures, handles, or whether the object
            needs symmetry.
          </p>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground" /> Width (cm)
            </Label>
            <Input
              type="number"
              placeholder="Optional"
              value={width}
              onChange={(event) => setWidth(event.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground" /> Height (cm)
            </Label>
            <Input
              type="number"
              placeholder="Optional"
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Ruler className="h-4 w-4 text-muted-foreground" /> Depth (cm)
            </Label>
            <Input
              type="number"
              placeholder="Optional"
              value={depth}
              onChange={(event) => setDepth(event.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" /> Material
            </Label>
            <Select value={material} onValueChange={(value: MaterialType) => setMaterial(value)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIALS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errors.dimensions ? (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {errors.dimensions}
          </p>
        ) : null}

        {errors.material ? (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {errors.material}
          </p>
        ) : null}

        {errors.submit ? (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.submit}
          </p>
        ) : null}

        <Button
          size="lg"
          className="w-full rounded-xl py-6 text-base"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Analyzing {selectedCountLabel}...
            </span>
          ) : (
            `Generate Pattern from ${selectedCountLabel}`
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default UploadPage;
