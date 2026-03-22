import {
  createMockPattern,
  type MaterialType,
  type PatternData,
  type UploadedReferenceImage,
} from "@shared/pattern";
import { sanitizePatternData } from "@/lib/pattern-schema";

export interface GeneratePatternInput {
  images: UploadedReferenceImage[];
  width?: number;
  height?: number;
  depth?: number;
  material: MaterialType;
  description?: string;
}

export interface GeneratedPatternResult {
  pattern: PatternData;
  usedFallback: boolean;
  source: "api" | "mock";
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export async function generatePattern({
  images,
  width,
  height,
  depth,
  material,
  description,
}: GeneratePatternInput): Promise<GeneratedPatternResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!hasConfiguredSupabase(supabaseUrl, supabaseKey)) {
    return {
      pattern: createMockPattern(),
      usedFallback: true,
      source: "mock",
    };
  }

  const imageData = await Promise.all(
    images.map(async (image) => ({
      base64: await fileToBase64(image.file),
      angle: image.angle,
    })),
  );

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-pattern`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      images: imageData,
      width,
      height,
      depth,
      material,
      description: description || undefined,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      typeof err.error === "string" ? err.error : "Failed to generate pattern.",
    );
  }

  const patternData = sanitizePatternData(await response.json());

  return {
    pattern: patternData,
    usedFallback: false,
    source: "api",
  };
}

function hasConfiguredSupabase(url: unknown, key: unknown) {
  if (typeof url !== "string" || typeof key !== "string" || !url.trim() || !key.trim()) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return /^https?:$/.test(parsedUrl.protocol);
  } catch {
    return false;
  }
}
