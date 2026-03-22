# PatternCraft — Full Recreation Spec

## Overview
AI-powered web app where users upload a photo of a 3D object and receive editable 2D cutting pattern pieces. Built for tailors, leatherworkers, upholsterers, and crafters. No authentication required.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS 3 with custom design tokens, shadcn/ui components
- **Animation**: Framer Motion
- **Routing**: React Router DOM v6
- **State**: React Query (TanStack)
- **Backend**: Supabase Edge Functions (Deno)
- **AI**: Google Gemini via Lovable AI Gateway (OpenAI-compatible API)

---

## Design System

### Palette (HSL values)
| Token | Light Mode | Purpose |
|-------|-----------|---------|
| `--background` | `35 30% 96%` | Warm cream background |
| `--foreground` | `25 20% 15%` | Deep brown text |
| `--primary` | `16 60% 48%` | Terracotta accent |
| `--primary-foreground` | `35 30% 96%` | Text on primary |
| `--secondary` | `35 35% 85%` | Light tan |
| `--secondary-foreground` | `25 20% 20%` | Text on secondary |
| `--muted` | `35 20% 90%` | Muted backgrounds |
| `--muted-foreground` | `25 10% 45%` | Muted text |
| `--accent` | `28 50% 70%` | Warm gold |
| `--accent-foreground` | `25 20% 15%` | Text on accent |
| `--card` | `35 25% 93%` | Card backgrounds |
| `--card-foreground` | `25 20% 15%` | Card text |
| `--border` | `30 20% 82%` | Borders |
| `--input` | `30 20% 82%` | Input borders |
| `--ring` | `16 60% 48%` | Focus ring |
| `--destructive` | `0 72% 51%` | Error red |
| `--radius` | `0.75rem` | Border radius |

### Custom Craft Tokens
| Token | Light Mode |
|-------|-----------|
| `--craft-cream` | `40 40% 94%` |
| `--craft-tan` | `35 35% 78%` |
| `--craft-terracotta` | `16 60% 48%` |
| `--craft-brown` | `25 30% 30%` |
| `--craft-warm-gray` | `30 10% 55%` |
| `--craft-linen` | `38 30% 90%` |

### Dark Mode Palette
| Token | Dark Mode |
|-------|----------|
| `--background` | `25 20% 10%` |
| `--foreground` | `35 20% 90%` |
| `--primary` | `16 55% 55%` |
| `--primary-foreground` | `25 20% 10%` |
| `--secondary` | `25 15% 22%` |
| `--secondary-foreground` | `35 20% 85%` |
| `--muted` | `25 12% 20%` |
| `--muted-foreground` | `30 10% 55%` |
| `--accent` | `28 40% 40%` |
| `--card` | `25 18% 14%` |
| `--border` | `25 15% 22%` |

### Typography
- **Headings**: `Lora` (serif) — Google Fonts
- **Body**: `DM Sans` (sans-serif) — Google Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&display=swap');
```

### Texture
Subtle SVG linen cross-hatch pattern applied via `.linen-texture` CSS class:

```css
.linen-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C8B75' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
```

---

## Pages & Routes

### 1. `/` — Landing Page

#### Header (shared Layout component)
- Sticky, blur backdrop (`backdrop-blur-sm bg-background/80`)
- Logo: Scissors icon (lucide-react) in primary-colored rounded square + "PatternCraft" in Lora serif
- Nav links (Home, New Pattern) shown only on non-home pages

#### Hero Section
- Badge: "AI-Powered Pattern Making" in secondary colors, rounded-full
- H1: `"Turn any object into a cutting pattern"` — "cutting pattern" in primary color
- Subtitle: "Upload a photo, and our AI generates editable 2D templates ready for fabric, leather, paper, or any material you work with."
- CTA Button: "Start Creating" with ArrowRight icon → navigates to `/upload`
- Decorative: Two blurred circles (tan 20% opacity, primary 10% opacity) positioned absolute

#### How It Works Section
- Background: `bg-card/50`
- H2: "How It Works"
- 4-step grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`):

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | Upload | Upload a Photo | Snap a picture of any 3D object you want to replicate |
| 2 | Cpu | AI Analyzes | Our AI breaks the object down into flat pattern pieces |
| 3 | PenTool | Edit & Refine | Adjust dimensions, seam allowances, and labels interactively |
| 4 | Download | Download | Export your pattern as a print-ready PDF |

- Each card: rounded-2xl, border, shadow-sm, icon in primary/10 bg, step number label uppercase
- Animation: Framer Motion staggered fade-up on viewport enter (`delay: i * 0.12`)

#### Built for Every Craft Section
- H2: "Built for Every Craft"
- 4 cards in grid:

| Icon | Label | Description |
|------|-------|-------------|
| Shirt | Garments | Dresses, jackets, bags |
| Sofa | Upholstery | Cushions, covers, slipcovers |
| BookOpen | Leatherwork | Wallets, cases, accessories |
| Scissors | Paper & Foam | Models, packaging, crafts |

- Cards: `bg-craft-linen hover:bg-secondary`, icon scales on hover

#### Bottom CTA Section
- "Ready to craft your first pattern?"
- "No signup needed. Upload an image and get started in seconds."
- Button → `/upload`

#### Footer
- Border-top, logo + "AI-powered pattern making for every crafter"

---

### 2. `/upload` — Upload & Generate Page

#### Drag-and-Drop Zone
- Dashed border (`border-2 border-dashed rounded-2xl`)
- States: default (`bg-craft-linen`), drag-over (`border-primary bg-primary/5`), with preview (`bg-card`)
- Default: Upload icon, "Drag & drop an image, or click to browse", "PNG, JPG, WEBP up to 20MB"
- With image: Shows preview (`max-h-72 rounded-xl shadow-md`) with red X button to remove
- Hidden file input triggered on click, accepts `image/*`

#### Options Row (3-column grid)
| Field | Type | Details |
|-------|------|---------|
| Width (cm) | Number input | Optional, with Ruler icon |
| Height (cm) | Number input | Optional, with Ruler icon |
| Material | Select dropdown | fabric, leather, paper, foam — with Layers icon |

#### Generate Button
- Full-width, `py-6 text-base rounded-xl`
- Disabled when no file or generating
- Loading state: spinning border animation + "Analyzing your object…"

#### Logic
1. Convert uploaded file to base64
2. POST to `${VITE_SUPABASE_URL}/functions/v1/generate-pattern`
3. On success: navigate to `/editor` with `{ pattern: data, material }` in router state
4. On error or no backend: fall back to mock pattern data

---

### 3. `/editor` — Pattern Editor Page

#### Left Sidebar (w-80, border-right)
Components in order:

1. **Back button**: Ghost variant, "← Back to Upload"
2. **Pattern info**: Name (serif, xl, bold) + piece count
3. **Scale card**: Slider 50–200%, displays current percentage
4. **Seam Allowance card**: Toggle switch + width slider (0–3cm, step 0.1). Default seam width by material:
   - fabric: 1.5cm
   - leather: 0.6cm
   - paper: 0cm
   - foam: 0.5cm
5. **Display card**: Labels toggle + Grain lines toggle
6. **Material info card**: `bg-primary/5 border-primary/20`, shows estimated material dimensions × current scale factor, material type
7. **Download button**: Full-width, Download icon, exports SVG file

#### Main Canvas Area
- Background: `bg-craft-cream`
- Zoom controls (top-right, absolute): ZoomIn, ZoomOut, Reset (Maximize icon) — outline variant with blur backdrop
- SVG element: `bg-background rounded-xl shadow-lg border`
  - ViewBox: `0 0 800 {calculated height}`
  - Pieces auto-laid out left-to-right, wrapping rows (max width 800px, gap 40px, padding 30px)

#### Pattern Piece Rendering (per piece)
```
<g transform="translate(x, y) scale(scaleFactor)">
  <!-- Seam allowance (if enabled): dashed primary outline, scaled outward -->
  <!-- Main shape: path fill craft-linen (selected: primary/12), stroke craft-brown (selected: primary) -->
  <!-- Grain line (if enabled): dashed line with arrow polygon -->
  <!-- Label (if enabled): piece name centered, dimensions below -->
</g>
```

- Click piece to select/deselect (changes fill + stroke)
- Zoom applies CSS `transform: scale()` with `transform-origin: top center`

---

### 4. `/*` — 404 Not Found
Standard not-found page.

---

## Edge Function: `generate-pattern`

### Endpoint
`POST /functions/v1/generate-pattern`

### Request Body
```json
{
  "image": "<base64 encoded image without data URL prefix>",
  "width": 30,
  "height": 20,
  "material": "fabric"
}
```

### Implementation
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers required
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, ..."
};
```

### AI Call
- **Model**: `google/gemini-3-flash-preview`
- **Gateway**: `https://ai.gateway.lovable.dev/v1/chat/completions` (OpenAI-compatible)
- **Auth**: `Bearer ${LOVABLE_API_KEY}` (auto-provisioned secret)
- **Messages**: System prompt + user message with image as `image_url` (base64 data URL)

### System Prompt (summary)
> You are an expert pattern maker. Given an image of a 3D object, generate 2D cutting pattern pieces. Return JSON with: name, pieces (id, label, SVG path in 0-200×0-300 space, width, height, grainLine), estimatedMaterial (width, length, unit). Generate 3-6 pieces. Material type and optional dimensions are provided for context.

### Response Processing
- Strip markdown code fences if present
- Parse JSON
- Return as-is

### Error Handling
| Status | Response |
|--------|----------|
| 429 | `{"error": "Rate limited, please try again shortly."}` |
| 402 | `{"error": "Credits exhausted. Please add funds."}` |
| 500 | `{"error": "<error message>"}` |

---

## Mock Pattern Data (fallback)

```json
{
  "name": "Sample Object Pattern",
  "pieces": [
    {
      "id": "front",
      "label": "Front Panel",
      "path": "M 20 20 L 180 20 L 200 80 L 200 280 L 0 280 L 0 80 Z",
      "width": 200,
      "height": 260,
      "grainLine": { "x1": 100, "y1": 40, "x2": 100, "y2": 260 }
    },
    {
      "id": "back",
      "label": "Back Panel",
      "path": "M 0 0 L 200 0 L 200 260 L 0 260 Z",
      "width": 200,
      "height": 260,
      "grainLine": { "x1": 100, "y1": 20, "x2": 100, "y2": 240 }
    },
    {
      "id": "side",
      "label": "Side Gusset",
      "path": "M 0 0 L 60 0 L 60 260 L 0 260 Z",
      "width": 60,
      "height": 260,
      "grainLine": { "x1": 30, "y1": 20, "x2": 30, "y2": 240 }
    },
    {
      "id": "bottom",
      "label": "Bottom Piece",
      "path": "M 10 0 L 190 0 Q 200 0 200 10 L 200 70 Q 200 80 190 80 L 10 80 Q 0 80 0 70 L 0 10 Q 0 0 10 0 Z",
      "width": 200,
      "height": 80,
      "grainLine": { "x1": 100, "y1": 10, "x2": 100, "y2": 70 }
    }
  ],
  "estimatedMaterial": { "width": 90, "length": 120, "unit": "cm" }
}
```

---

## Dependencies

### Production
```
react, react-dom, react-router-dom, @tanstack/react-query,
framer-motion, lucide-react, class-variance-authority, clsx,
tailwind-merge, tailwindcss-animate, sonner, vaul, zod,
@radix-ui/react-slot, @radix-ui/react-select, @radix-ui/react-slider,
@radix-ui/react-switch, @radix-ui/react-label, @radix-ui/react-toast,
@radix-ui/react-tooltip, @radix-ui/react-dialog, @radix-ui/react-popover,
@radix-ui/react-progress, @radix-ui/react-separator, @radix-ui/react-tabs,
@supabase/supabase-js
```

### Dev
```
vite, @vitejs/plugin-react-swc, typescript, tailwindcss, postcss,
autoprefixer, @tailwindcss/typography, eslint, vitest
```

### shadcn/ui Components Used
Button, Input, Label, Select, Slider, Switch, Card (+ CardHeader, CardTitle, CardContent),
Toast/Toaster, Tooltip, Progress, Skeleton, Separator, Tabs

---

## File Structure
```
src/
├── App.tsx                    # Routes wrapped in QueryClient, Tooltip, Toaster, Layout
├── App.css                    # Minimal (design system in index.css)
├── index.css                  # Full design system: colors, fonts, texture
├── main.tsx                   # React DOM render
├── components/
│   ├── Layout.tsx             # Shared header + linen-texture wrapper
│   └── ui/                    # shadcn/ui components
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client init
│       └── types.ts           # Generated types
├── lib/
│   └── utils.ts               # cn() utility
└── pages/
    ├── Index.tsx               # Landing page
    ├── UploadPage.tsx          # Upload & generate
    ├── EditorPage.tsx          # Pattern editor
    └── NotFound.tsx            # 404

supabase/
└── functions/
    └── generate-pattern/
        └── index.ts            # AI pattern generation edge function

tailwind.config.ts              # Extended with craft colors, fonts
```
