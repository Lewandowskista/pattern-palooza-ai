import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, image, width, height, depth, material, description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Support both old single-image format and new multi-image format
    const imageList: { base64: string; angle: string }[] = images
      ? images
      : image
      ? [{ base64: image, angle: "Front view" }]
      : [];

    if (imageList.length === 0) throw new Error("No images provided");

    const seamDefaults: Record<string, number> = {
      fabric: 1.5,
      leather: 0.6,
      paper: 0,
      foam: 0.5,
    };

    const dimInfo = [
      width ? `Width: ${width} cm` : null,
      height ? `Height: ${height} cm` : null,
      depth ? `Depth: ${depth} cm` : null,
    ].filter(Boolean).join(", ");

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
- Curves should follow the actual contours of the object — do NOT simplify everything to rectangles
- For rounded corners, use Q or C curves
- For circular/elliptical pieces, use A (arc) commands
- Start path at top-left of the piece and go clockwise

### Step 5: Add Construction Details
For each piece specify:
- A grain line (usually runs lengthwise/vertically through the center of the piece)
- The piece label (descriptive name matching standard pattern terminology)

## ACCURACY RULES
- Pieces must FIT TOGETHER when assembled. Adjacent edges must have matching lengths.
- A cylinder body piece width = circumference = π × diameter
- A box face width must match the adjacent face height
- Curved surfaces require darts or ease — include them as separate small triangular pieces or notches
- If the object has symmetry, pattern pieces should reflect that
- Include ALL pieces needed — don't skip small pieces like straps, tabs, pocket flaps, or reinforcements

## OUTPUT FORMAT

Return ONLY a valid JSON object (no markdown fences, no explanation):
{
  "name": "Descriptive name of the object",
  "description": "Brief construction notes — how pieces assemble together",
  "pieces": [
    {
      "id": "unique_snake_case_id",
      "label": "Human Readable Label (e.g. Front Panel, Side Gusset, Strap)",
      "path": "M ... Z",
      "width": <max X coordinate used in path>,
      "height": <max Y coordinate used in path>,
      "grainLine": { "x1": <number>, "y1": <number>, "x2": <number>, "y2": <number> },
      "notes": "Assembly notes for this piece (e.g. 'Attach to front panel along curved edge')"
    }
  ],
  "estimatedMaterial": {
    "width": <total material width in cm>,
    "length": <total material length in cm>,
    "unit": "cm"
  },
  "assemblyOrder": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}

Material type: "${material}" (seam allowance: ${seamDefaults[material] || 1} cm)
${description ? `\nUser description: "${description}"` : ""}
${imageList.length > 1 ? `\nYou have ${imageList.length} reference images from different angles. Cross-reference them to understand the full 3D geometry.` : ""}`;

    // Build content array with all images
    const userContent: any[] = [];

    if (imageList.length === 1) {
      userContent.push({ type: "text", text: "Analyze this object and generate precise 2D cutting pattern pieces. Return ONLY the JSON." });
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${imageList[0].base64}` },
      });
    } else {
      userContent.push({
        type: "text",
        text: `I'm providing ${imageList.length} reference photos from different angles. Cross-reference ALL of them to understand the full 3D shape before generating pattern pieces. Return ONLY the JSON.`,
      });
      for (const img of imageList) {
        userContent.push({ type: "text", text: `[${img.angle}]:` });
        userContent.push({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img.base64}` },
        });
      }
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    // Use Pro model for better accuracy with visual analysis
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
    }

    // Try to extract JSON if there's surrounding text
    if (!jsonStr.startsWith("{")) {
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) jsonStr = match[0];
    }

    const patternData = JSON.parse(jsonStr);

    // Validate and sanitize the output
    if (!patternData.pieces || !Array.isArray(patternData.pieces) || patternData.pieces.length === 0) {
      throw new Error("AI returned no pattern pieces");
    }

    // Ensure all pieces have required fields
    for (const piece of patternData.pieces) {
      if (!piece.path || !piece.id || !piece.label) {
        throw new Error("AI returned incomplete pattern piece data");
      }
      // Ensure path is closed
      if (!piece.path.trim().endsWith("Z") && !piece.path.trim().endsWith("z")) {
        piece.path = piece.path.trim() + " Z";
      }
      // Default grain line if missing
      if (!piece.grainLine) {
        piece.grainLine = {
          x1: (piece.width || 100) / 2,
          y1: 20,
          x2: (piece.width || 100) / 2,
          y2: (piece.height || 200) - 20,
        };
      }
    }

    return new Response(JSON.stringify(patternData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pattern error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
