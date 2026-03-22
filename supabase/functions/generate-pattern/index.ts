import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "npm:zod";
import {
  type AssemblyStep,
  generateAssemblyStepsFallback,
  MATERIAL_VALUES,
  MAX_DIMENSION_CM,
  type PatternPiece,
  SEAM_ALLOWANCES,
  type MaterialType,
} from "../../../shared/pattern.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const finiteNumber = z.number().finite();
const materialSchema = z.enum(MATERIAL_VALUES as [MaterialType, ...MaterialType[]]);

const requestImageSchema = z.object({
  base64: z.string().trim().min(1),
  angle: z.string().trim().min(1),
});

const requestSchema = z
  .object({
    images: z.array(requestImageSchema).max(8).optional(),
    image: z.string().trim().min(1).optional(),
    width: finiteNumber.positive().max(MAX_DIMENSION_CM).optional(),
    height: finiteNumber.positive().max(MAX_DIMENSION_CM).optional(),
    depth: finiteNumber.positive().max(MAX_DIMENSION_CM).optional(),
    material: materialSchema.default("fabric"),
    description: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.images?.length && !value.image) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one image is required.",
        path: ["images"],
      });
    }
  });

const patternPieceSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  path: z.string().trim().min(1),
  width: finiteNumber.positive().max(MAX_DIMENSION_CM),
  height: finiteNumber.positive().max(MAX_DIMENSION_CM),
  grainLine: z
    .object({
      x1: finiteNumber,
      y1: finiteNumber,
      x2: finiteNumber,
      y2: finiteNumber,
    })
    .optional(),
  notes: z.string().trim().min(1).optional(),
});

const patternResponseSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  pieces: z.array(patternPieceSchema).min(1),
  assemblySteps: z
    .array(
      z.object({
        stepNumber: z.number().int().positive(),
        piecesInvolved: z.array(z.string().trim().min(1)).default([]),
        instruction: z.string().trim().min(1),
      }),
    )
    .optional(),
  estimatedMaterial: z.object({
    width: finiteNumber.nonnegative().max(MAX_DIMENSION_CM),
    length: finiteNumber.nonnegative().max(MAX_DIMENSION_CM),
    unit: z.string().trim().min(1),
  }),
});

type GatewayContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeSvgPath(path: string) {
  const withoutUnsafeChars = path
    .replace(/[^MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return /[Zz]$/.test(withoutUnsafeChars)
    ? withoutUnsafeChars
    : `${withoutUnsafeChars} Z`;
}

function sanitizePatternData(input: unknown) {
  const parsed = patternResponseSchema.parse(input);
  const normalizedPieces: PatternPiece[] = parsed.pieces.map((piece) => ({
    ...piece,
    path: normalizeSvgPath(piece.path),
    grainLine: piece.grainLine ?? {
      x1: piece.width / 2,
      y1: 20,
      x2: piece.width / 2,
      y2: Math.max(piece.height - 20, 20),
    },
  }));
  const normalizedAssemblySteps: AssemblyStep[] =
    parsed.assemblySteps?.length
      ? parsed.assemblySteps.map((step, index) => ({
          ...step,
          stepNumber: index + 1,
        }))
      : generateAssemblyStepsFallback(normalizedPieces, parsed.description);

  return {
    ...parsed,
    pieces: normalizedPieces,
    assemblySteps: normalizedAssemblySteps,
  };
}

function extractJsonPayload(content: string) {
  let jsonString = content.trim();

  if (jsonString.startsWith("```")) {
    jsonString = jsonString.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }

  if (!jsonString.startsWith("{")) {
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) {
      jsonString = match[0];
    }
  }

  return JSON.parse(jsonString);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = requestSchema.parse(await req.json());
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const imageList = body.images?.length
      ? body.images
      : body.image
        ? [{ base64: body.image, angle: "Front view" }]
        : [];

    const dimInfo = [
      body.width ? `Width: ${body.width} cm` : null,
      body.height ? `Height: ${body.height} cm` : null,
      body.depth ? `Depth: ${body.depth} cm` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const systemPrompt = `You are a master pattern maker with decades of experience in tailoring, upholstery, leatherwork, and industrial pattern engineering. Your task is to analyze reference images of a 3D object and produce precise, production-ready 2D flat pattern pieces.

## ANALYSIS METHODOLOGY

Follow this exact process:

### Step 1: Identify the Object
Study all provided reference images. Determine:
- What the object is (bag, garment, cushion, case, etc.)
- Its overall geometric shape (box, cylinder, sphere, organic, compound)
- How many distinct surfaces/faces it has
- Where seams, edges, and joints would naturally fall

### Step 2: Decompose into Surfaces
Break the 3D object into its individual flat or developable surfaces:
- For BOX-like objects: front, back, left side, right side, top, bottom (6 faces)
- For CYLINDRICAL objects: body wrap (rectangle), top circle, bottom circle
- For BAGS: front panel, back panel, side gussets, bottom, flap/closure, pockets
- For GARMENTS: bodice front, bodice back, sleeves, collar, facings
- For ORGANIC shapes: approximate with darts, gathers, or segmented panels

### Step 3: Determine Proportions
${dimInfo ? `The user provided these real measurements: ${dimInfo}. Use them as the ground truth for proportions.` : "No measurements were given. Estimate proportions from the images. Use the relative sizes of features visible in the photos."}
Ensure all pieces are proportionally correct relative to each other.

### Step 4: Draw Accurate SVG Paths
For each pattern piece, create a precise SVG path:
- Use M (move), L (line), Q (quadratic curve), C (cubic curve), A (arc), and Z (close) commands
- ALL coordinates must be within 0-200 (x) and 0-300 (y) range
- The path MUST be a closed shape (end with Z)
- Curves should follow the actual contours of the object; do not simplify everything to rectangles
- For rounded corners, use Q or C curves
- For circular or elliptical pieces, use A (arc) commands
- Start path at top-left of the piece and go clockwise

### Step 5: Add Construction Details
For each piece specify:
- A grain line (usually runs lengthwise or vertically through the center of the piece)
- The piece label (descriptive name matching standard pattern terminology)

## ACCURACY RULES
- Pieces must FIT TOGETHER when assembled. Adjacent edges must have matching lengths.
- A cylinder body piece width = circumference = pi x diameter
- A box face width must match the adjacent face height
- Curved surfaces require darts or ease; include them as separate small triangular pieces or notches
- If the object has symmetry, pattern pieces should reflect that
- Include ALL pieces needed; don't skip small pieces like straps, tabs, pocket flaps, or reinforcements

## OUTPUT FORMAT

Return ONLY a valid JSON object (no markdown fences, no explanation):
{
  "name": "Descriptive name of the object",
  "description": "Brief construction notes - how pieces assemble together",
  "pieces": [
    {
      "id": "unique_snake_case_id",
      "label": "Human Readable Label (e.g. Front Panel, Side Gusset, Strap)",
      "path": "M ... Z",
      "width": number,
      "height": number,
      "grainLine": { "x1": number, "y1": number, "x2": number, "y2": number },
      "notes": "Assembly notes for this piece (e.g. Attach to front panel along curved edge)"
    }
  ],
  "estimatedMaterial": {
    "width": number,
    "length": number,
    "unit": "cm"
  },
  "assemblyOrder": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}

Material type: "${body.material}" (standard seam allowance: ${SEAM_ALLOWANCES[body.material] ?? 1} cm)
${body.description ? `\nUser description: "${body.description}"` : ""}
${imageList.length > 1 ? `\nYou have ${imageList.length} reference images from different angles. Cross-reference them to understand the full 3D geometry.` : ""}`;

    const userContent: GatewayContentPart[] = imageList.length === 1
      ? [
          {
            type: "text",
            text: "Analyze this object and generate precise 2D cutting pattern pieces. Return ONLY the JSON.",
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageList[0].base64}` },
          },
        ]
      : [
          {
            type: "text",
            text: `I'm providing ${imageList.length} reference photos from different angles. Cross-reference ALL of them to understand the full 3D shape before generating pattern pieces. Return ONLY the JSON.`,
          },
          ...imageList.flatMap((image) => [
            { type: "text", text: `[${image.angle}]` } as const,
            {
              type: "image_url" as const,
              image_url: { url: `data:image/jpeg;base64,${image.base64}` },
            },
          ]),
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse(
          { error: "Rate limited, please try again shortly.", category: "gateway_rate_limit" },
          429,
        );
      }

      if (response.status === 402) {
        return jsonResponse(
          { error: "Credits exhausted. Please add funds.", category: "gateway_billing" },
          402,
        );
      }

      const text = await response.text();
      console.error("AI gateway error", {
        status: response.status,
        bodyPreview: text.slice(0, 300),
      });

      return jsonResponse(
        { error: "AI gateway error", category: "gateway_error" },
        502,
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      console.error("AI gateway returned empty content");
      return jsonResponse(
        { error: "The AI response was empty.", category: "invalid_model_output" },
        502,
      );
    }

    let parsedPayload: unknown;

    try {
      parsedPayload = extractJsonPayload(content);
    } catch (error) {
      console.error("Failed to parse AI JSON", {
        error: error instanceof Error ? error.message : String(error),
        contentPreview: content.slice(0, 300),
      });
      return jsonResponse(
        { error: "Failed to parse AI response.", category: "response_parse_error" },
        502,
      );
    }

    try {
      const patternData = sanitizePatternData(parsedPayload);
      return jsonResponse(patternData);
    } catch (error) {
      const issues = error instanceof z.ZodError ? error.issues : undefined;
      console.error("Invalid AI payload", {
        issues,
        payloadPreview: JSON.stringify(parsedPayload).slice(0, 300),
      });

      return jsonResponse(
        { error: "AI returned invalid pattern data.", category: "invalid_model_output" },
        502,
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(
        {
          error: "Invalid request payload.",
          category: "invalid_request",
          details: error.flatten(),
        },
        400,
      );
    }

    console.error("generate-pattern error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error", category: "internal_error" },
      500,
    );
  }
});
