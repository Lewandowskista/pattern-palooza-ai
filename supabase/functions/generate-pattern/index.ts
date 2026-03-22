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
    const { image, width, height, material } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const seamDefaults: Record<string, number> = {
      fabric: 1.5,
      leather: 0.6,
      paper: 0,
      foam: 0.5,
    };

    const systemPrompt = `You are an expert pattern maker and tailor. Given an image of a 3D object, analyze its shape and generate 2D cutting pattern pieces that could be assembled to replicate the object.

Return a JSON object with this exact structure (no markdown, no code fences):
{
  "name": "descriptive name of the object",
  "pieces": [
    {
      "id": "unique_id",
      "label": "Human readable label",
      "path": "SVG path string (M/L/Q/Z commands) fitting in a 0-200 x 0-300 coordinate space",
      "width": number (max coordinate X),
      "height": number (max coordinate Y),
      "grainLine": { "x1": number, "y1": number, "x2": number, "y2": number }
    }
  ],
  "estimatedMaterial": {
    "width": estimated fabric width in cm,
    "length": estimated fabric length in cm,
    "unit": "cm"
  }
}

Guidelines:
- Break the object into logical flat pieces (front, back, sides, bottom, gussets, etc.)
- Each piece path should be a closed SVG path using M, L, Q, and Z commands
- Keep coordinates within 0-200 for width and 0-300 for height
- Include grain lines as vertical center lines for each piece
- Material is "${material}" with default seam allowance of ${seamDefaults[material] || 1} cm
${width ? `- Object width is approximately ${width} cm` : ""}
${height ? `- Object height is approximately ${height} cm` : ""}
- Generate 3-6 pattern pieces depending on the object complexity
- Make pieces realistic and proportional`;

    const userPrompt = "Analyze this object image and generate 2D cutting pattern pieces for it. Return ONLY the JSON object, no other text.";

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${image}` },
          },
        ],
      },
    ];

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
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

    const patternData = JSON.parse(jsonStr);

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
